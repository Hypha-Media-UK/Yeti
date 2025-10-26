import { Router } from 'express';
import { BuildingController } from '../controllers/building.controller';

const router = Router();
const buildingController = new BuildingController();

router.get('/', buildingController.getAllBuildings);
router.get('/:id', buildingController.getBuildingById);
router.post('/', buildingController.createBuilding);
router.put('/:id', buildingController.updateBuilding);
router.delete('/:id', buildingController.deleteBuilding);

export default router;

