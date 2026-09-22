// Optional 3D renderer, never a source of gameplay truth. Exactly one locked
// browser dependency: three@0.180.0 ESM on jsDelivr. The simple view remains
// playable if this experimental network-loaded renderer cannot start.
const THREE_MODULE="https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
export const RENDERER_DEPENDENCY=Object.freeze({
  package:"three",version:"0.180.0",url:THREE_MODULE,
  upstream:"https://github.com/mrdoob/three.js",license:"MIT",
});
export async function createListeningRoom({mount,onInspect,onFallback}) {
  if(!mount || typeof onInspect!=="function" || typeof onFallback!=="function")
    throw new Error("Listening room requires a mount and inspect/fallback callbacks");
  if(typeof window==="undefined" || typeof document==="undefined")
    throw new Error("Listening room needs a browser");
  const canvas=document.createElement("canvas");
  canvas.className="room-canvas";
  canvas.setAttribute("aria-hidden","true");
  let disposed=false,renderer,resizeObserver,raf=0,roomState=null,projection=null;
  mount.append(canvas);
  let three;
  try {
    const gl=canvas.getContext("webgl2",{alpha:false,antialias:true,powerPreference:"low-power"});
    if(!gl)throw new Error("WebGL2 is unavailable");
    three=await import(THREE_MODULE);
    if(disposed)throw new Error("Room was closed during loading");
    renderer=new three.WebGLRenderer({canvas,context:gl,antialias:true,powerPreference:"low-power"});
  } catch(err) {
    canvas.remove();
    throw err;
  }
  const T=three;
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.25;
  const scene=new T.Scene();
  scene.background=new T.Color("#e5d6c1");
  const camera=new T.OrthographicCamera(-5,5,4,-4,.05,100);
  camera.position.set(7.5,5.4,8.5);
  camera.lookAt(0,.9,0);
  scene.add(new T.HemisphereLight("#fff3d6","#9b7d69",2));
  const sun=new T.DirectionalLight("#fff3d6",3);
  sun.position.set(-2,7,6);scene.add(sun);
  const fill=new T.PointLight("#f6af83",17,9);
  fill.position.set(1.8,2.2,-1.6);scene.add(fill);
  const mat=(color,roughness=1)=>new T.MeshStandardMaterial({color,roughness});
  const materials={
    floor:mat("#b28d68"),wall:mat("#e5d2b8"),trim:mat("#a2785e"),
    timber:mat("#80533a"),woodLight:mat("#b17c51"),sage:mat("#687d65"),
    linen:mat("#e2ccab"),rose:mat("#bc816b"),ink:mat("#45362f"),
    gold:mat("#cbb075",.5),pot:mat("#b28b74"),leaf:mat("#64815c"),
    dark:mat("#343040"),window:mat("#d7b491",.8),
    screen:new T.MeshStandardMaterial({color:"#d1a56c",emissive:"#aa6839",
      emissiveIntensity:.25,roughness:.35}),
  };
  const box=(parent,w,h,d,m,x,y,z,rot=0)=>{
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);
    mesh.position.set(x,y,z);mesh.rotation.y=rot;parent.add(mesh);return mesh;
  };
  const ball=(parent,r,m,x,y,z,scale=[1,1,1])=>{
    const mesh=new T.Mesh(new T.SphereGeometry(r,12,9),m);
    mesh.position.set(x,y,z);mesh.scale.set(...scale);parent.add(mesh);return mesh;
  };
  const cylinder=(parent,rt,rb,h,m,x,y,z)=>{
    const mesh=new T.Mesh(new T.CylinderGeometry(rt,rb,h,12),m);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  };
  // Physically closed room shell and closed, non-traversable entry.
  box(scene,6,.15,4.5,materials.floor,0,-.09,0);
  box(scene,6,2.8,.14,materials.wall,0,1.4,-2.32);
  box(scene,.14,2.8,4.5,materials.wall,-3.04,1.4,0);
  box(scene,6,.1,.14,materials.trim,0,.04,-2.22);
  box(scene,.14,.1,4.5,materials.trim,-2.93,.04,0);
  // Closed door: opening is not promised as traversable in this fixed-camera study.
  box(scene,.95,2.22,.06,materials.timber,.13,1.11,-2.21);
  box(scene,.82,2.08,.03,materials.woodLight,.13,1.11,-2.16);
  ball(scene,.052,materials.gold,.47,1.01,-2.12);
  // A shallow wall picture is deliberate wall art, not a fake window.
  box(scene,1.15,.75,.05,materials.timber,-1.9,1.83,-2.19);
  box(scene,1.02,.62,.055,materials.sage,-1.9,1.83,-2.15);
  ball(scene,.28,materials.gold,-1.65,1.93,-2.09,[1,.48,.13]);
  // Rug + central table, neither acts as a hotspot in this two-seed composition.
  const rug=new T.Mesh(new T.CylinderGeometry(1.62,1.62,.018,32),materials.rose);
  rug.scale.set(1,.65,.73);rug.position.set(0,.012,.65);scene.add(rug);
  box(scene,1.42,.12,.76,materials.timber,.25,.63,.5);
  for(const x of [-.31,.81])for(const z of [.21,.79])
    box(scene,.11,.57,.1,materials.timber,x,.31,z);
  cylinder(scene,.16,.16,.055,materials.linen,-.01,.74,.45);
  ball(scene,.14,materials.gold,-.01,.87,.45,[.83,.65,.95]);
  cylinder(scene,.09,.08,.14,materials.pot,.49,.76,.45);
  ball(scene,.12,materials.leaf,.49,.87,.45,[1.1,.8,1]);
  // Listening chair; a full group is a single inspect-only clickable region.
  const chair=new T.Group();chair.userData.hotspot="listening-chair";
  chair.position.set(-1.45,0,.18);chair.rotation.y=.31;scene.add(chair);
  box(chair,1.25,.25,1.1,materials.sage,0,.65,0);
  box(chair,1.25,1.05,.22,materials.sage,0,1.24,-.48);
  box(chair,.2,.56,1.1,materials.sage,-.62,.92,0);
  box(chair,.2,.56,1.1,materials.sage,.62,.92,0);
  box(chair,.91,.14,.83,materials.linen,0,.84,.08);
  box(chair,.78,.61,.14,materials.linen,0,1.23,-.33);
  for(const x of [-.44,.44])for(const z of [-.33,.33])
    cylinder(chair,.07,.09,.55,materials.timber,x,.32,z);
  // Picture machine and viewing aperture are the second inspect-only hotspot.
  const machine=new T.Group();machine.userData.hotspot="picture-machine";
  machine.position.set(1.65,0,-.22);machine.rotation.y=-.34;scene.add(machine);
  cylinder(machine,.55,.56,.09,materials.timber,0,.60,0);
  cylinder(machine,.06,.08,.55,materials.timber,0,.3,0);
  box(machine,.85,.69,.56,materials.woodLight,0,1.02,0);
  box(machine,.68,.46,.025,materials.dark,0,1.07,.293);
  const aperture=box(machine,.57,.36,.029,materials.screen,0,1.07,.313);
  // An unmistakable but bounded visual echo, rendered ONLY from replay's
  // committed parented event. Merely previewing a candidate never shows this.
  const echoMaterial=new T.MeshBasicMaterial({color:"#f4d38d",transparent:true,opacity:.88});
  const echoRing=new T.Mesh(new T.TorusGeometry(.44,.025,6,40),echoMaterial);
  echoRing.position.set(0,1.07,.39);
  echoRing.visible=false;
  machine.add(echoRing);
  const echoRingOuter=new T.Mesh(new T.TorusGeometry(.53,.013,6,40),
    new T.MeshBasicMaterial({color:"#d59165",transparent:true,opacity:.73}));
  echoRingOuter.position.set(0,1.07,.405);echoRingOuter.visible=false;
  machine.add(echoRingOuter);
  box(machine,.87,.06,.65,materials.trim,0,.69,0);
  cylinder(machine,.05,.05,.025,materials.gold,-.29,.79,.31);
  cylinder(machine,.05,.05,.025,materials.gold,.29,.79,.31);
  // Lamps, books, plant add depth without claiming extra interactions.
  cylinder(scene,.14,.2,.42,materials.pot,2.62,.23,-1.65);
  cylinder(scene,.04,.04,.57,materials.leaf,2.62,.76,-1.65);
  for(let i=0;i<5;i++)ball(scene,.24,materials.leaf,2.62+Math.sin(i*1.7)*.17,
    1.06+Math.cos(i*1.1)*.11,-1.65+Math.cos(i*2)*.11,[1,.65,.7]);
  cylinder(scene,.04,.06,1.57,materials.gold,2.65,.81,1.15);
  const lampshade=new T.Mesh(new T.ConeGeometry(.31,.43,14),materials.linen);
  lampshade.rotation.z=Math.PI;lampshade.position.set(2.65,1.61,1.15);scene.add(lampshade);
  box(scene,.92,.11,.3,materials.timber,-2.4,.77,-1.54);
  for(let i=0;i<5;i++)box(scene,.12,.4+i*.05,.22,i%2?materials.rose:materials.sage,
    -2.7+i*.15,1.03+i*.025,-1.55);
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();
  const activeGroups=[machine,chair];
  const hotspotFromPointer=(event)=>{
    const bounds=canvas.getBoundingClientRect();
    if(!bounds.width || !bounds.height)return null;
    pointer.x=(event.clientX-bounds.left)/bounds.width*2-1;
    pointer.y=-(event.clientY-bounds.top)/bounds.height*2+1;
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(activeGroups,true)[0];
    let parent=hit?.object;
    while(parent && !parent.userData.hotspot)parent=parent.parent;
    return parent?.userData.hotspot??null;
  };
  const click=(event)=>{
    if(disposed || projection?.stage!=="room")return;
    const id=hotspotFromPointer(event);
    if(id)onInspect(id);
  };
  const pointerMove=(event)=>{
    canvas.style.cursor=projection?.stage==="room"&&hotspotFromPointer(event)?"pointer":"default";
  };
  canvas.addEventListener("click",click);
  canvas.addEventListener("pointermove",pointerMove);
  const lost=(event)=>{
    event.preventDefault();
    onFallback("The spatial renderer lost its graphics context. Simple view is still playable.");
  };
  canvas.addEventListener("webglcontextlost",lost,{passive:false});
  const scheduleRender=()=>{
    if(disposed||raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;if(!disposed && renderer)renderer.render(scene,camera);
    });
  };
  const resize=()=>{
    if(disposed || !renderer)return;
    const rect=mount.getBoundingClientRect();
    const width=Math.max(1,Math.round(rect.width));
    const height=Math.max(1,Math.round(rect.height));
    const aspect=width/height;
    const halfWidth=aspect<1.12?4.9:4.75;
    const halfHeight=halfWidth/aspect;
    camera.left=-halfWidth;camera.right=halfWidth;
    camera.top=halfHeight;camera.bottom=-halfHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.setSize(width,height,false);
    scheduleRender();
  };
  resizeObserver=new ResizeObserver(resize);
  resizeObserver.observe(mount);
  // The Three.js scene is static until a game-state projection or viewport changes.
  const update=(next)=>{
    if(disposed)return;
    projection=next;roomState=next?.hero?.status??"empty";
    const intensity=roomState==="echo" ? 0.91 :
      roomState==="kept" ? 0.58 : roomState==="proposal" ? 0.42 : 0.16;
    materials.screen.emissiveIntensity=intensity;
    materials.screen.color.set(roomState==="echo"?"#efd1a7":roomState==="proposal"?"#ab88ba":"#d1a56c");
    aperture.scale.x=roomState==="echo"?1.07:1;
    echoRing.visible=roomState==="echo";
    echoRingOuter.visible=roomState==="echo";
    scheduleRender();
  };
  resize();scheduleRender();
  return {
    update,
    dispose() {
      if(disposed)return;disposed=true;
      if(raf)cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      canvas.removeEventListener("click",click);
      canvas.removeEventListener("pointermove",pointerMove);
      canvas.removeEventListener("webglcontextlost",lost);
      scene.traverse(object=>{
        if(object.isMesh)object.geometry.dispose();
      });
      Object.values(materials).forEach(m=>m.dispose());
      echoMaterial.dispose();echoRingOuter.material.dispose();
      renderer.dispose();canvas.remove();
    },
  };
}
