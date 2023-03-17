import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';
import {   IFCWALLSTANDARDCASE,
     IFCSLAB,
     IFCFURNISHINGELEMENT,
     IFCDOOR,
     IFCWINDOW,
     IFCPLATE,
     IFCMEMBER} from 'web-ifc';
const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });

// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();






async function loadIfc(url) {
	await viewer.IFC.setWasmPath("/wasm/");
	const model = await viewer.IFC.loadIfcUrl(url);
	model.removeFromParent();
	await viewer.shadowDropper.renderShadow(model.modelID);

	await setupAllCategories();
}

loadIfc('haus.ifc');
const scene = viewer.context.getScene();
 const categories ={
      IFCWALLSTANDARDCASE,
      IFCSLAB,
      IFCFURNISHINGELEMENT,
      IFCDOOR,
      IFCWINDOW,
      IFCPLATE,
      IFCMEMBER


 }
 function getName(category) {
	const names = Object.keys(categories);
	return names.find(name => categories[name] === category);
}

async function getAll(category) {
	return viewer.IFC.loader.ifcManager.getAllItemsOfType(0, category, false);
}

async function newSubsetOfType(category) {
	const ids = await getAll(category);
	return viewer.IFC.loader.ifcManager.createSubset({
		modelID: 0,
		scene,
		ids,
		removePrevious: true,
		customID: category.toString(),
	});
}


const subsets = {};

async function setupAllCategories() {
	const allCategories = Object.values(categories);
	for (let i = 0; i < allCategories.length; i++) {
		const category = allCategories[i];
		await setupCategory(category);
	}
}


async function setupCategory(category) {
	subsets[category] = await newSubsetOfType(category);
	setupCheckBox(category);
}


function setupCheckBox(category) {
	const name = getName(category);
	const checkBox = document.getElementById(name);
	checkBox.addEventListener('change', (event) => {
		const checked = event.target.checked;
		const subset = subsets[category];
		if (checked) scene.add(subset);
		else subset.removeFromParent();
	});
}

  

