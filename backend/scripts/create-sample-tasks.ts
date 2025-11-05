import { supabase } from '../src/config/database';

async function createSampleTasks() {
  console.log('Creating 10 sample tasks...\n');

  // Fetch departments with includeInTasks = true
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .eq('is_active', true)
    .eq('include_in_tasks', true);

  if (deptError || !departments || departments.length === 0) {
    console.error('Failed to fetch departments:', deptError);
    return;
  }

  console.log(`Found ${departments.length} departments for tasks`);

  // Fetch pool staff
  const { data: poolStaff, error: staffError } = await supabase
    .from('staff')
    .select('id, first_name, last_name')
    .eq('is_pool_staff', true)
    .eq('is_active', true);

  if (staffError || !poolStaff || poolStaff.length === 0) {
    console.error('Failed to fetch pool staff:', staffError);
    return;
  }

  console.log(`Found ${poolStaff.length} pool staff members`);

  // Fetch task items
  const { data: taskItems, error: itemsError } = await supabase
    .from('task_items')
    .select('id, name')
    .eq('is_active', true);

  if (itemsError || !taskItems || taskItems.length === 0) {
    console.error('Failed to fetch task items:', itemsError);
    return;
  }

  console.log(`Found ${taskItems.length} task items\n`);

  // Helper function to get random element from array
  const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Helper function to get random time in minutes since midnight
  const randomMinutes = (): number => {
    return Math.floor(Math.random() * (24 * 60)); // 0 to 1439 minutes
  };

  // Helper function to convert minutes to HH:MM format (capped at 23:59)
  const minutesToTime = (minutes: number): string => {
    const cappedMinutes = Math.min(minutes, 1439); // Max 23:59
    const hour = Math.floor(cappedMinutes / 60);
    const minute = cappedMinutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Helper function to get random status
  const randomStatus = (): 'pending' | 'completed' => {
    return Math.random() > 0.3 ? 'completed' : 'pending'; // 70% completed, 30% pending
  };

  const tasks = [];

  for (let i = 0; i < 10; i++) {
    const originDept = random(departments);
    let destinationDept = random(departments);
    
    // Ensure origin and destination are different
    while (destinationDept.id === originDept.id) {
      destinationDept = random(departments);
    }

    const taskItem = random(taskItems);
    const staff = random(poolStaff);
    const status = randomStatus();

    // Generate times ensuring allocated >= requested and completed >= allocated
    const requestedMinutes = randomMinutes();
    const allocatedMinutes = requestedMinutes + Math.floor(Math.random() * 120); // 0-2 hours after requested
    const completedMinutes = status === 'completed'
      ? allocatedMinutes + Math.floor(Math.random() * 240) // 0-4 hours after allocated
      : null;

    const requestedTime = minutesToTime(requestedMinutes);
    const allocatedTime = minutesToTime(allocatedMinutes);
    const completedTime = completedMinutes !== null ? minutesToTime(completedMinutes) : null;

    const task = {
      origin_area_id: originDept.id,
      origin_area_type: 'department',
      destination_area_id: destinationDept.id,
      destination_area_type: 'department',
      task_item_id: taskItem.id,
      requested_time: requestedTime,
      allocated_time: allocatedTime,
      completed_time: completedTime,
      assigned_staff_id: staff.id,
      status: status,
    };

    tasks.push(task);

    console.log(`Task ${i + 1}:`);
    console.log(`  From: ${originDept.name}`);
    console.log(`  To: ${destinationDept.name}`);
    console.log(`  Item: ${taskItem.name}`);
    console.log(`  Assigned to: ${staff.first_name} ${staff.last_name}`);
    console.log(`  Status: ${status}`);
    console.log(`  Times: ${requestedTime} → ${allocatedTime}${completedTime ? ` → ${completedTime}` : ''}`);
    console.log('');
  }

  // Insert all tasks
  const { data: createdTasks, error: createError } = await supabase
    .from('tasks')
    .insert(tasks)
    .select();

  if (createError) {
    console.error('Failed to create tasks:', createError);
    return;
  }

  console.log(`\n✅ Successfully created ${createdTasks?.length || 0} sample tasks!`);
}

createSampleTasks()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

