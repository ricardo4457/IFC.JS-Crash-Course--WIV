import { Color, LineBasicMaterial, MeshBasicMaterial } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';
import Drawing from 'dxf-writer';


const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });

// Create grid and axes

init();
async function init() {
	await viewer.IFC.setWasmPath('/wasm/');
	const model = await viewer.IFC.loadIfcUrl('./haus.ifc');

	// Setup camera controls
	const controls = viewer.context.ifcCamera.cameraControls;
	controls.setPosition(7.6, 4.3, 24.8, false);
	controls.setTarget(-7.1, -0.3, 2.5, false);

	await viewer.plans.computeAllPlanViews(model.modelID);

	const lineMaterial = new LineBasicMaterial({ color: 'black' });
	const baseMaterial = new MeshBasicMaterial({
		polygonOffset: true,
		polygonOffsetFactor: 1, // positive value pushes polygon further away
		polygonOffsetUnits: 1,
	});
	await viewer.edges.create('example', model.modelID, lineMaterial, baseMaterial);

	// Floor plan viewing

	const allPlans = viewer.plans.getAll(model.modelID);

	const container = document.getElementById('button-container');

	for (const plan of allPlans) {
		const currentPlan = viewer.plans.planLists[model.modelID][plan];
		console.log(currentPlan);

		const button = document.createElement('button');
		container.appendChild(button);
		button.textContent = currentPlan.name;
		button.onclick = () => {
			viewer.plans.goTo(model.modelID, plan);
			viewer.edges.toggle('example', true);
               toggleShadow(true);

		};
	}

	const button = document.createElement('button');
	container.appendChild(button);
	button.textContent = 'Exit';
	button.onclick = () => {
		viewer.plans.exitPlanView();
		viewer.edges.toggle('example', false);
          toggleShadow(true);
	};

	// Floor plan export

	viewer.dxf.initializeJSDXF(Drawing);

	const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
	const storeys = ifcProject.children[0].children[0].children;
	for (let storey of storeys) {
		for (let child of storey.children) {
			if (child.children.length) {
				storey.children.push(...child.children);
			}
		}
	}

	for (const plan of allPlans) {
		const currentPlan = viewer.plans.planLists[model.modelID][plan];
		console.log(currentPlan);

		const button = document.createElement('button');
		container.appendChild(button);
		button.textContent = 'Export ' + currentPlan.name;
		button.onclick = () => {
			const storey = storeys.find(storey => storey.expressID === currentPlan.expressID);
			drawProjectedItems(storey, currentPlan, model.modelID);
		};
	}
}

const dummySubsetMat = new MeshBasicMaterial({visible: false});

async function drawProjectedItems(storey, plan, modelID) {


	if (!viewer.dxf.drawings[plan.name]) viewer.dxf.newDrawing(plan.name);

	
	const ids = storey.children.map(item => item.expressID);

	
	if (!ids.length) return;


	const subset = viewer.IFC.loader.ifcManager.createSubset({
		modelID,
		ids,
		removePrevious: true,
		customID: 'floor_plan_generation',
		material: dummySubsetMat,
	});

	const filteredPoints = [];
	const edges = await viewer.edgesProjector.projectEdges(subset);
	const positions = edges.geometry.attributes.position.array;


	const tolerance = 0.01;
	for (let i = 0; i < positions.length - 5; i += 6) {

		const a = positions[i] - positions[i + 3];
	
		const b = -positions[i + 2] + positions[i + 5];

		const distance = Math.sqrt(a * a + b * b);

		if (distance > tolerance) {
			filteredPoints.push([positions[i], -positions[i + 2], positions[i + 3], -positions[i + 5]]);
		}

	}

	
	viewer.dxf.drawEdges(plan.name, filteredPoints, 'Projection', Drawing.ACI.BLUE, 'CONTINUOUS');

	edges.geometry.dispose();


	
		viewer.dxf.drawNamedLayer(plan.name, plan, 'thick', 'Section', Drawing.ACI.RED, 'CONTINUOUS');
		viewer.dxf.drawNamedLayer(plan.name, plan, 'thin', 'Section_Secondary', Drawing.ACI.CYAN, 'CONTINUOUS');

	const result = viewer.dxf.exportDXF(plan.name);
	const link = document.createElement('a');
	link.download = 'floorplan.dxf';
	link.href = URL.createObjectURL(result);
	document.body.appendChild(link);
	link.click();
	link.remove();
}
