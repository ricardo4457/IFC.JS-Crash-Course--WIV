import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });

// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();

Load();


async function Load(){
     const model = await viewer.IFC.loadIfcUrl('/haus.ifc');
     await viewer.shadowDropper.renderShadow(model.modelID);
     viewer.context.renderer.postProduction.active = true;
     
     viewer.dimensions.active = true;
     viewer.dimensions.previewActive = true;

     window.ondblclick = () => {

          viewer.dimensions.create();
     }
     window.onkeydown = (event) => {
          if(event.code === 'Delete'){
               viewer.dimensions.delete();
          }

     }

}

