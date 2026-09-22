"""STATIC FIELD / THE FIRST BELL — Porch 3D r1 reconstruction.
Run: blender --background --python build_porch.py
Requires Blender with bpy and the bundled glTF 2.0 exporter.
This reconstructs the 2026-09-21 Higgsfield 3D Jutsu r1 procedural blockout;
it is not guaranteed to be byte-identical to the vendor's GLB/.blend export.
"""
import bpy
from mathutils import Vector
from pathlib import Path
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
def mat(n,c):
    m=bpy.data.materials.new(n)
    m.diffuse_color=(*c,1)
    m.use_nodes=True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1)
    return m
wood=mat('Cedar',(.27,.13,.07))
edge=mat('Oak',(.49,.29,.13))
night=mat('Night',(.03,.035,.05))
sand=mat('Desert',(.4,.27,.15))
brass=mat('Bell brass',(.56,.38,.12))
glow=mat('Lantern amber',(.9,.55,.23))
def cube(n,l,d,m):
    bpy.ops.mesh.primitive_cube_add(size=1,location=l)
    o=bpy.context.object
    o.name=n
    o.dimensions=d
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(m)
def cyl(n,l,r,h,m):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=h,location=l)
    o=bpy.context.object
    o.name=n
    o.data.materials.append(m)
cube('Desert',(0,0,-.25),(18,18,.45),sand)
cube('Porch platform',(0,0,.15),(8,4.6,.3),wood)
for i in range(10):
    cube('Floorboard '+str(i),(-3.55+i*.79,0,.33),(.72,4.5,.05),edge if i%3==0 else wood)
cube('House wall',(0,2.35,2.1),(8,.22,4.2),night)
cube('Porch roof',(0,.1,4.18),(8.5,5.5,.25),wood)
for x in [-3.7,3.7]:
    for y in [-2,2]:
        cube('Pillar '+str(x)+str(y),(x,y,2.1),(.2,.2,4.1),edge)
cube('Door opening',(0,2.21,1.65),(1.4,.06,2.6),night)
for x in [-.77,.77]:
    cube('Door frame '+str(x),(x,2.13,1.64),(.08,.1,2.75),edge)
for z in [.31,3.02]:
    cube('Door crossbar '+str(z),(0,2.13,z),(1.6,.1,.08),edge)
cube('Warm window',(-2.25,2.2,2.2),(1.4,.06,1.25),glow)
cube('Chair seat',(-1.7,-.9,.78),(.9,.78,.13),edge)
cube('Empty chair back',(-1.7,-.54,1.31),(.9,.1,1),wood)
for x in [-2.06,-1.34]:
    for y in [-1.2,-.62]:
        cube('Chair leg '+str(x)+str(y),(x,y,.39),(.1,.1,.74),night)
cube('Workbench top',(1.8,.65,1),(1.5,.7,.13),edge)
for x in [1.2,2.4]:
    for y in [.4,.9]:
        cube('Workbench leg '+str(x)+str(y),(x,y,.49),(.1,.1,.95),wood)
cyl('First Bell / body',(0,-1.8,3.34),.28,.4,brass)
cyl('First Bell / lip',(0,-1.8,3.12),.35,.06,brass)
cube('Bell chain',(0,-1.8,3.7),(.035,.035,.36),brass)
cube('Open corner / vertical',(1.15,2.15,1.4),(.045,.04,.39),brass)
cube('Open corner / horizontal',(1.36,2.15,1.21),(.43,.04,.045),brass)
bpy.ops.object.camera_add(location=(9,-12,7))
cam=bpy.context.object
cam.name='First Bell camera'
cam.rotation_euler=(Vector((0,0,1.7))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO'
cam.data.ortho_scale=11.4
bpy.context.scene.camera=cam
def light(n,l,p,c):
    bpy.ops.object.light_add(type='AREA',location=l)
    o=bpy.context.object
    o.name=n
    o.data.energy=p
    o.data.color=c
    o.data.shape='DISK'
    o.data.size=6
    o.rotation_euler=(Vector((0,0,1.4))-o.location).to_track_quat('-Z','Y').to_euler()
light('Moonlight',(-3,-4,8),1600,(.55,.7,1))
light('Warm window lantern',(-1,1,3),950,(1,.66,.35))
light('Soft fill',(3,-3,6),700,(.8,.85,1))
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=800
scene.render.resolution_y=560
scene.render.resolution_percentage=100
out=Path(__file__).resolve().parent
bpy.ops.wm.save_as_mainfile(filepath=str(out/'porch-reconstructed.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'porch-reconstructed.glb'),export_format='GLB')
print('PORCH_RECONSTRUCTED objects:',len(bpy.data.objects))
