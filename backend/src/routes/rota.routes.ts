import { Router } from 'express';
import { RotaController } from '../controllers/rota.controller';
import { StaffController } from '../controllers/staff.controller';

const router = Router();
const rotaController = new RotaController();
const staffController = new StaffController();

router.get('/day/:date', rotaController.getRotaForDay);
router.get('/range', rotaController.getRotaForRange);

router.get('/assignments', rotaController.getAssignments);
router.post('/assignments', rotaController.createAssignment);
router.post('/assignments/temporary', rotaController.createTemporaryAssignment);
router.get('/assignments/temporary/:staffId', rotaController.getTemporaryAssignments);
router.delete('/assignments/:id', rotaController.deleteAssignment);

router.delete('/schedules/:id', staffController.deleteSchedule);

export default router;

