import { supabase } from '../src/config/database';

async function checkContractedHours() {
  console.log('Checking contracted hours for PTS staff...\n');

  // Get PTS staff IDs
  const { data: allocations } = await supabase
    .from('staff_allocations')
    .select('staff_id')
    .eq('area_type', 'service')
    .eq('area_id', 1); // PTS ID

  if (!allocations || allocations.length === 0) {
    console.log('No PTS staff found');
    return;
  }

  const ptsStaffIds = allocations.map(a => a.staff_id);
  console.log(`Checking contracted hours for ${ptsStaffIds.length} PTS staff...\n`);

  // Get staff details with contracted hours
  const { data: staff } = await supabase
    .from('staff')
    .select(`
      id,
      first_name,
      last_name,
      shift_id,
      use_cycle_for_permanent,
      reference_shift_id
    `)
    .in('id', ptsStaffIds);

  console.log('Staff details:');
  staff?.forEach(s => {
    console.log(`  ${s.first_name} ${s.last_name}:`);
    console.log(`    - shift_id: ${s.shift_id}`);
    console.log(`    - use_cycle_for_permanent: ${s.use_cycle_for_permanent}`);
    console.log(`    - reference_shift_id: ${s.reference_shift_id}`);
  });

  // Get contracted hours for these staff
  const { data: contractedHours } = await supabase
    .from('staff_contracted_hours')
    .select('*')
    .in('staff_id', ptsStaffIds);

  console.log(`\nContracted hours (${contractedHours?.length || 0} records):`);
  
  const hoursByStaff = new Map<number, any[]>();
  contractedHours?.forEach(ch => {
    const existing = hoursByStaff.get(ch.staff_id) || [];
    existing.push(ch);
    hoursByStaff.set(ch.staff_id, existing);
  });

  staff?.forEach(s => {
    const hours = hoursByStaff.get(s.id) || [];
    console.log(`\n  ${s.first_name} ${s.last_name} (${hours.length} records):`);
    hours.forEach(h => {
      console.log(`    - Day ${h.day_of_week}: ${h.start_time} - ${h.end_time}`);
    });
    if (hours.length === 0) {
      console.log(`    - NO CONTRACTED HOURS`);
    }
  });
}

checkContractedHours()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

