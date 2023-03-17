import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });
viewer.grid.setGrid();
viewer.axes.setAxes();

async function loadIfc(url) {
    await viewer.IFC.setWasmPath("/wasm/");
    const model = await viewer.IFC.loadIfcUrl(url);
    await viewer.shadowDropper.renderShadow(model.modelID);
}



loadIfc('haus.ifc');

window.ondblclick = () => viewer.IFC.selector.pickIfcItem();
window.ondblclick = async () => {
     const result = await viewer.IFC.selector.highlightIfcItem();
     if (!result) return;
     const { modelID, id } = result;
     const props = await viewer.IFC.getProperties(modelID, id, true, false);
     console.log(props);
 };
window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
