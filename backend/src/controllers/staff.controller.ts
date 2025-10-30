import { Request, Response } from 'express';
import { StaffRepository } from '../repositories/staff.repository';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { validateStaffStatus, parseId } from '../utils/validation.utils';
import { isForeignKeyError } from '../utils/error.utils';

export class StaffController {
  private staffRepo: StaffRepository;
  private scheduleRepo: ScheduleRepository;

  constructor() {
    this.staffRepo = new StaffRepository();
    this.scheduleRepo = new ScheduleRepository();
  }

  getAllStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, includeInactive, isPoolStaff } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (includeInactive === 'true') filters.includeInactive = true;
      if (isPoolStaff !== undefined) filters.isPoolStaff = isPoolStaff === 'true';

      const staff = await this.staffRepo.findAll(filters);

      res.json({ staff });
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff' });
    }
  };

  getStaffById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Staff ID');

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
      const {
        firstName,
        lastName,
        status,
        shiftId,
        cycleType,
        daysOffset,
        customShiftStart,
        customShiftEnd,
        useCycleForPermanent,
        referenceShiftId,
        useContractedHoursForShift,
        isPoolStaff
      } = req.body;

      if (!firstName || !lastName || !status) {
        res.status(400).json({ error: 'First name, last name, and status are required' });
        return;
      }

      const statusValidation = validateStaffStatus(status);
      if (!statusValidation.valid) {
        res.status(400).json({ error: statusValidation.error });
        return;
      }

      const staff = await this.staffRepo.create({
        firstName,
        lastName,
        status,
        shiftId: shiftId || null,
        cycleType: cycleType || null,
        daysOffset: daysOffset || 0,
        customShiftStart: customShiftStart || null,
        customShiftEnd: customShiftEnd || null,
        useCycleForPermanent: useCycleForPermanent || false,
        referenceShiftId: referenceShiftId || null,
        useContractedHoursForShift: useContractedHoursForShift || false,
        isPoolStaff: isPoolStaff || false,
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
      const id = parseId(req.params.id, 'Staff ID');

      const updates = req.body;

      if (updates.status) {
        const validation = validateStaffStatus(updates.status);
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
      const id = parseId(req.params.id, 'Staff ID');
      const hardDelete = req.query.hard === 'true';

      const success = hardDelete
        ? await this.staffRepo.hardDelete(id)
        : await this.staffRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Staff member not found' });
        return;
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting staff:', error);

      if (isForeignKeyError(error)) {
        res.status(409).json({ error: 'Cannot delete staff member because they have related records' });
        return;
      }

      res.status(500).json({ error: 'Failed to delete staff member' });
    }
  };

  getStaffSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseId(req.params.staffId, 'Staff ID');

      const schedules = await this.scheduleRepo.findByStaffId(staffId);

      res.json({ schedules });
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  };

  createStaffSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseId(req.params.staffId, 'Staff ID');

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
      const id = parseId(req.params.id, 'Schedule ID');

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

