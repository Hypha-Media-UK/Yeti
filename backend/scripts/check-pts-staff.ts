import { supabase } from '../src/config/database';

async function checkPTSStaff() {
  console.log('Checking Patient Transport Services staff...\n');

  // Find Patient Transport Services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, include_in_main_rota')
    .ilike('name', '%patient%transport%');

  if (servicesError) {
    console.error('Error fetching services:', servicesError);
    return;
  }

  console.log('Patient Transport Services:', services);

  if (!services || services.length === 0) {
    console.log('No Patient Transport Services found');
    return;
  }

  const ptsId = services[0].id;
  console.log(`\nChecking staff for PTS (ID: ${ptsId})...\n`);

  // Check allocations
  const { data: allocations, error: allocError } = await supabase
    .from('staff_allocations')
    .select(`
      *,
      staff:staff_id(id, first_name, last_name, is_pool_staff, shift_id, is_active)
    `)
    .eq('area_type', 'service')
    .eq('area_id', ptsId);

  if (allocError) {
    console.error('Error fetching allocations:', allocError);
    return;
  }

  console.log(`Found ${allocations?.length || 0} staff allocations for PTS:`);
  allocations?.forEach(alloc => {
    const staff = alloc.staff as any;
    console.log(`  - ${staff.first_name} ${staff.last_name} (ID: ${staff.id}, Pool: ${staff.is_pool_staff}, Shift: ${staff.shift_id}, Active: ${staff.is_active})`);
  });

  // Check all pool staff
  const { data: poolStaff, error: poolError } = await supabase
    .from('staff')
    .select('id, first_name, last_name, shift_id, is_active')
    .eq('is_pool_staff', true)
    .eq('is_active', true);

  if (poolError) {
    console.error('Error fetching pool staff:', poolError);
    return;
  }

  console.log(`\nAll active pool staff (${poolStaff?.length || 0}):`);
  poolStaff?.forEach(staff => {
    console.log(`  - ${staff.first_name} ${staff.last_name} (ID: ${staff.id}, Shift: ${staff.shift_id})`);
  });

  // Check shifts
  const { data: shifts, error: shiftsError } = await supabase
    .from('shifts')
    .select('id, name, type, is_active')
    .eq('is_active', true);

  if (shiftsError) {
    console.error('Error fetching shifts:', shiftsError);
    return;
  }

  console.log(`\nActive shifts (${shifts?.length || 0}):`);
  shifts?.forEach(shift => {
    console.log(`  - ${shift.name} (ID: ${shift.id}, Type: ${shift.type})`);
  });
}

checkPTSStaff()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

