import { Request, Response } from 'express';
import { ShiftRepository } from '../repositories/shift.repository';

export class ShiftController {
  private shiftRepo: ShiftRepository;

  constructor() {
    this.shiftRepo = new ShiftRepository();
  }

  // GET /api/shifts
  getAllShifts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { includeInactive } = req.query;
      const shifts = await this.shiftRepo.findAll(includeInactive === 'true');
      res.json({ shifts });
    } catch (error) {
      console.error('Error fetching shifts:', error);
      res.status(500).json({ error: 'Failed to fetch shifts' });
    }
  };

  // GET /api/shifts/:id
  getShiftById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid shift ID' });
        return;
      }

      const shift = await this.shiftRepo.findById(id);

      if (!shift) {
        res.status(404).json({ error: 'Shift not found' });
        return;
      }

      res.json({ shift });
    } catch (error) {
      console.error('Error fetching shift:', error);
      res.status(500).json({ error: 'Failed to fetch shift' });
    }
  };

  // GET /api/shifts/type/:type
  getShiftsByType = async (req: Request, res: Response): Promise<void> => {
    try {
      const type = req.params.type;

      if (type !== 'day' && type !== 'night') {
        res.status(400).json({ error: 'Invalid shift type. Must be "day" or "night"' });
        return;
      }

      const shifts = await this.shiftRepo.findByType(type);
      res.json({ shifts });
    } catch (error) {
      console.error('Error fetching shifts by type:', error);
      res.status(500).json({ error: 'Failed to fetch shifts' });
    }
  };

  // POST /api/shifts
  createShift = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, type, color, description, cycleType, cycleLength, daysOffset } = req.body;

      // Validation
      if (!name || !name.trim()) {
        res.status(400).json({ error: 'Shift name is required' });
        return;
      }

      if (!type || (type !== 'day' && type !== 'night')) {
        res.status(400).json({ error: 'Shift type must be "day" or "night"' });
        return;
      }

      // Validate cycle type
      const validCycleTypes = ['4-on-4-off', '16-day-supervisor', 'relief', 'fixed'];
      if (cycleType && !validCycleTypes.includes(cycleType)) {
        res.status(400).json({ error: 'Invalid cycle type' });
        return;
      }

      // Validate cycle length for non-relief/fixed shifts
      if (cycleType !== 'relief' && cycleType !== 'fixed') {
        if (cycleLength === undefined || cycleLength === null || cycleLength < 1) {
          res.status(400).json({ error: 'Cycle length is required and must be at least 1 for non-relief/fixed shifts' });
          return;
        }
      }

      // Validate days offset
      if (daysOffset !== undefined && daysOffset !== null) {
        if (daysOffset < 0) {
          res.status(400).json({ error: 'Days offset cannot be negative' });
          return;
        }
        if (cycleLength && daysOffset >= cycleLength) {
          res.status(400).json({ error: `Days offset must be less than cycle length (0-${cycleLength - 1})` });
          return;
        }
      }

      // Check for duplicate name
      const exists = await this.shiftRepo.existsByName(name.trim());
      if (exists) {
        res.status(409).json({ error: 'A shift with this name already exists' });
        return;
      }

      // Validate color format if provided
      if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        res.status(400).json({ error: 'Color must be a valid hex color (e.g., #3B82F6)' });
        return;
      }

      const shift = await this.shiftRepo.create({
        name: name.trim(),
        type,
        color,
        description: description?.trim() || null,
        cycleType: cycleType || null,
        cycleLength: cycleLength || null,
        daysOffset: daysOffset !== undefined ? daysOffset : 0,
      });

      res.status(201).json({ shift });
    } catch (error: any) {
      console.error('Error creating shift:', error);

      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'A shift with this name already exists' });
        return;
      }

      res.status(500).json({ error: 'Failed to create shift' });
    }
  };

  // PUT /api/shifts/:id
  updateShift = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid shift ID' });
        return;
      }

      const updates = req.body;

      // Validation
      if (updates.name !== undefined && !updates.name.trim()) {
        res.status(400).json({ error: 'Shift name cannot be empty' });
        return;
      }

      if (updates.type !== undefined && updates.type !== 'day' && updates.type !== 'night') {
        res.status(400).json({ error: 'Shift type must be "day" or "night"' });
        return;
      }

      if (updates.color !== undefined && updates.color && !/^#[0-9A-Fa-f]{6}$/.test(updates.color)) {
        res.status(400).json({ error: 'Color must be a valid hex color (e.g., #3B82F6)' });
        return;
      }

      // Validate cycle type if provided
      if (updates.cycleType !== undefined) {
        const validCycleTypes = ['4-on-4-off', '16-day-supervisor', 'relief', 'fixed'];
        if (updates.cycleType && !validCycleTypes.includes(updates.cycleType)) {
          res.status(400).json({ error: 'Invalid cycle type' });
          return;
        }
      }

      // Validate cycle length for non-relief/fixed shifts
      if (updates.cycleType !== undefined && updates.cycleType !== 'relief' && updates.cycleType !== 'fixed') {
        if (updates.cycleLength === undefined || updates.cycleLength === null || updates.cycleLength < 1) {
          res.status(400).json({ error: 'Cycle length is required and must be at least 1 for non-relief/fixed shifts' });
          return;
        }
      }

      // Validate days offset if provided
      if (updates.daysOffset !== undefined && updates.daysOffset !== null) {
        if (updates.daysOffset < 0) {
          res.status(400).json({ error: 'Days offset cannot be negative' });
          return;
        }
        // Get current shift to check cycle length
        const currentShift = await this.shiftRepo.findById(id);
        if (currentShift) {
          const cycleLength = updates.cycleLength !== undefined ? updates.cycleLength : currentShift.cycleLength;
          if (cycleLength && updates.daysOffset >= cycleLength) {
            res.status(400).json({ error: `Days offset must be less than cycle length (0-${cycleLength - 1})` });
            return;
          }
        }
      }

      // Check for duplicate name (excluding current shift)
      if (updates.name) {
        const exists = await this.shiftRepo.existsByName(updates.name.trim(), id);
        if (exists) {
          res.status(409).json({ error: 'A shift with this name already exists' });
          return;
        }
      }

      // Warn if changing type and shift has staff assigned
      if (updates.type !== undefined) {
        const staffCount = await this.shiftRepo.getStaffCount(id);
        if (staffCount > 0) {
          // Note: We allow the change but could add a warning header
          res.setHeader('X-Warning', `This shift has ${staffCount} staff member(s) assigned. Changing type will affect their rota display.`);
        }
      }

      // Warn if changing cycle parameters and shift has staff assigned
      if (updates.cycleType !== undefined || updates.cycleLength !== undefined || updates.daysOffset !== undefined) {
        const staffCount = await this.shiftRepo.getStaffCount(id);
        if (staffCount > 0) {
          res.setHeader('X-Warning', `This shift has ${staffCount} staff member(s) assigned. Changing cycle parameters will affect their rota schedule.`);
        }
      }

      const shift = await this.shiftRepo.update(id, updates);

      if (!shift) {
        res.status(404).json({ error: 'Shift not found' });
        return;
      }

      res.json({ shift });
    } catch (error: any) {
      console.error('Error updating shift:', error);

      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'A shift with this name already exists' });
        return;
      }

      res.status(500).json({ error: 'Failed to update shift' });
    }
  };

  // DELETE /api/shifts/:id
  deleteShift = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid shift ID' });
        return;
      }

      // Check if shift has staff assigned
      const staffCount = await this.shiftRepo.getStaffCount(id);
      if (staffCount > 0) {
        res.status(409).json({ 
          error: `Cannot delete shift. ${staffCount} staff member(s) are currently assigned to this shift. Please reassign them first.` 
        });
        return;
      }

      const success = await this.shiftRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Shift not found' });
        return;
      }

      res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
      console.error('Error deleting shift:', error);
      res.status(500).json({ error: 'Failed to delete shift' });
    }
  };

  // GET /api/shifts/:id/staff-count
  getShiftStaffCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid shift ID' });
        return;
      }

      const count = await this.shiftRepo.getStaffCount(id);
      res.json({ shiftId: id, staffCount: count });
    } catch (error) {
      console.error('Error fetching staff count:', error);
      res.status(500).json({ error: 'Failed to fetch staff count' });
    }
  };
}

