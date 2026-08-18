const fs = require('fs');

// Read GLB header and inspect JSON chunk
const buffer = fs.readFileSync('public/models/f1_car.glb');
const magic = buffer.readUInt32LE(0);
const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);
const chunkLength = buffer.readUInt32LE(12);
const chunkType = buffer.readUInt32LE(16);

console.log('GLB Header:', { magic: magic.toString(16), version, length, chunkLength });

if (chunkType === 0x4E4F534A) { // 'JSON'
  const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);
  console.log('Nodes count:', gltf.nodes ? gltf.nodes.length : 0);
  console.log('Meshes count:', gltf.meshes ? gltf.meshes.length : 0);
  console.log('Materials count:', gltf.materials ? gltf.materials.length : 0);
  if (gltf.nodes) {
    console.log('Node names:', gltf.nodes.map(n => n.name));
  }
}
