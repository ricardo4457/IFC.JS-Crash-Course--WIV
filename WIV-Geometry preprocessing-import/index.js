import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });
viewer.grid.setGrid();
viewer.axes.setAxes();

let properties;

async function load() {
	// Load geometry
	await viewer.IFC.setWasmPath('/wasm/');
	await viewer.GLTF.loadModel('/gltf/model-part.gltf_curtainwalls_allFloors.gltf');
	await viewer.GLTF.loadModel('/gltf/model-part.gltf_doors_allFloors.gltf');
	await viewer.GLTF.loadModel('/gltf/model-part.gltf_slabs_allFloors.gltf');



	const rawProperties = await fetch('/gltf/properties.json');
	properties = await rawProperties.json();

	
	const tree = await constructSpatialTree();
	console.log(tree);
}

load();


window.ondblclick = async () => {
	const result = await viewer.IFC.selector.pickIfcItem(true);
	const foundProperties = properties[result.id];
	getPropertySets(foundProperties);
	console.log(foundProperties);
};
window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();


function getFirstItemOfType(type) {
	return Object.values(properties).find(item => item.type === type);
}

function getAllItemsOfType(type) {
	return Object.values(properties).filter(item => item.type === type);
}


async function constructSpatialTree() {
	const ifcProject = getFirstItemOfType('IFCPROJECT');

	const ifcProjectNode = {
		expressID: ifcProject.expressID,
		type: 'IFCPROJECT',
		children: [],
	};

	const relContained = getAllItemsOfType('IFCRELAGGREGATES');
	const relSpatial = getAllItemsOfType('IFCRELCONTAINEDINSPATIALSTRUCTURE');

	await constructSpatialTreeNode(
		ifcProjectNode,
		relContained,
		relSpatial,
	);

	return ifcProjectNode;

}


async function constructSpatialTreeNode(
	item,
	contains,
	spatials,
) {
	const spatialRels = spatials.filter(
		rel => rel.RelatingStructure === item.expressID,
	);
	const containsRels = contains.filter(
		rel => rel.RelatingObject === item.expressID,
	);

	const spatialRelsIDs = [];
	spatialRels.forEach(rel => spatialRelsIDs.push(...rel.RelatedElements));

	const containsRelsIDs = [];
	containsRels.forEach(rel => containsRelsIDs.push(...rel.RelatedObjects));

	const childrenIDs = [...spatialRelsIDs, ...containsRelsIDs];

	const children = [];
	for (let i = 0; i < childrenIDs.length; i++) {
		const childID = childrenIDs[i];
		const props = properties[childID];
		const child = {
			expressID: props.expressID,
			type: props.type,
			children: [],
		};

		await constructSpatialTreeNode(child, contains, spatials);
		children.push(child);
	}

	item.children = children;
}



function getPropertySets(props) {
	const id = props.expressID;
	const propertyValues = Object.values(properties);
	const allPsetsRels = propertyValues.filter(item => item.type === 'IFCRELDEFINESBYPROPERTIES');
	const relatedPsetsRels = allPsetsRels.filter(item => item.RelatedObjects.includes(id));
	const psets = relatedPsetsRels.map(item => properties[item.RelatingPropertyDefinition]);
	for(let pset of psets) {
		pset.HasProperty = pset.HasProperties.map(id => properties[id]);
	}
	props.psets = psets;
}