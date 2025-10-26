import { Request, Response } from 'express';
import { StaffRepository } from '../repositories/staff.repository';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { validateStaffStatus, validateShiftGroup } from '../utils/validation.utils';

export class StaffController {
  private staffRepo: StaffRepository;
  private scheduleRepo: ScheduleRepository;

  constructor() {
    this.staffRepo = new StaffRepository();
    this.scheduleRepo = new ScheduleRepository();
  }

  getAllStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, group, includeInactive } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (group) filters.group = group as string;
      if (includeInactive === 'true') filters.includeInactive = true;

      const staff = await this.staffRepo.findAll(filters);

      res.json({ staff });
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff' });
    }
  };

  getStaffById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      const staff = await this.staffRepo.findById(id);

      if (!staff) {
        res.status(404).json({ error: 'Staff member not found' });
        return;
      }

      res.json({ staff });
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff member' });
    }
  };

  createStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, status, group, cycleType, daysOffset, departmentId } = req.body;

      if (!firstName || !lastName || !status) {
        res.status(400).json({ error: 'First name, last name, and status are required' });
        return;
      }

      const statusValidation = validateStaffStatus(status);
      if (!statusValidation.valid) {
        res.status(400).json({ error: statusValidation.error });
        return;
      }

      const groupValidation = validateShiftGroup(group);
      if (!groupValidation.valid) {
        res.status(400).json({ error: groupValidation.error });
        return;
      }

      const staff = await this.staffRepo.create({
        firstName,
        lastName,
        status,
        group: group || null,
        departmentId: departmentId || null,
        cycleType: cycleType || null,
        daysOffset: daysOffset || 0,
        isActive: true,
      });

      res.status(201).json({ staff });
    } catch (error) {
      console.error('Error creating staff:', error);
      res.status(500).json({ error: 'Failed to create staff member' });
    }
  };

  updateStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      const updates = req.body;

      if (updates.status) {
        const validation = validateStaffStatus(updates.status);
        if (!validation.valid) {
          res.status(400).json({ error: validation.error });
          return;
        }
      }

      if (updates.group !== undefined) {
        const validation = validateShiftGroup(updates.group);
        if (!validation.valid) {
          res.status(400).json({ error: validation.error });
          return;
        }
      }

      const staff = await this.staffRepo.update(id, updates);

      if (!staff) {
        res.status(404).json({ error: 'Staff member not found' });
        return;
      }

      res.json({ staff });
    } catch (error) {
      console.error('Error updating staff:', error);
      res.status(500).json({ error: 'Failed to update staff member' });
    }
  };

  deleteStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      const success = await this.staffRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Staff member not found' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting staff:', error);
      res.status(500).json({ error: 'Failed to delete staff member' });
    }
  };

  getStaffSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);

      if (isNaN(staffId)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      const schedules = await this.scheduleRepo.findByStaffId(staffId);

      res.json({ schedules });
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  };

  createStaffSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);

      if (isNaN(staffId)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      const { dayOfWeek, shiftStart, shiftEnd, effectiveFrom, effectiveTo } = req.body;

      if (!shiftStart || !shiftEnd) {
        res.status(400).json({ error: 'Shift start and end times are required' });
        return;
      }

      const schedule = await this.scheduleRepo.create({
        staffId,
        dayOfWeek: dayOfWeek || null,
        shiftStart,
        shiftEnd,
        effectiveFrom: effectiveFrom || null,
        effectiveTo: effectiveTo || null,
      });

      res.status(201).json({ schedule });
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  };

  deleteSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid schedule ID' });
        return;
      }

      const success = await this.scheduleRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ error: 'Failed to delete schedule' });
    }
  };
}

