const fs = require('fs');

let code = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

const oldStart = '                // Static Pre-rendered Canvas Texture Pool (Crystal-Clear High-Contrast Badges)';
const oldEnd = '    // Merge Shockwave Ring Particle Effect';

const sIdx = code.indexOf(oldStart);
const eIdx = code.indexOf(oldEnd);

if (sIdx !== -1 && eIdx !== -1) {
  const roadFighterEntities = `// --- 9. ⚡ ROAD FIGHTER GOTHAM ENTITIES (ENERGY CORES & HAZARDS) ---
    interface RoadFighterEntity {
      group: THREE.Group;
      mesh: THREE.Mesh;
      skyBeam: THREE.Mesh;
      light: THREE.PointLight;
      isHazard: boolean;
      laneIndex: number;
      z: number;
      active: boolean;
      nearMissed: boolean;
    }

    const lanePositions = [-2.5, 0.0, 2.5];
    const entityPool: RoadFighterEntity[] = [];
    const poolSize = 10;

    const coreGeo = new THREE.OctahedronGeometry(0.65, 2);
    const hazardGeo = new THREE.BoxGeometry(1.4, 0.75, 1.4);
    const skyBeamGeo = new THREE.CylinderGeometry(0.04, 0.16, 16, 8);

    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0c1e30,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.95,
      metalness: 0.85,
      roughness: 0.15,
    });

    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0x200a0a,
      emissive: 0xef4444,
      emissiveIntensity: 0.90,
      metalness: 0.85,
      roughness: 0.20,
    });

    for (let i = 0; i < poolSize; i++) {
      const group = new THREE.Group();
      const isHazard = i % 3 === 0;

      const mesh = new THREE.Mesh(isHazard ? hazardGeo : coreGeo, isHazard ? hazardMat.clone() : coreMat.clone());
      mesh.position.y = 0.45;
      group.add(mesh);

      // Sky Laser Pillar
      const beamMat = new THREE.MeshBasicMaterial({
        color: isHazard ? 0xef4444 : 0x38bdf8,
        transparent: true,
        opacity: isHazard ? 0.20 : 0.40,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const skyBeam = new THREE.Mesh(skyBeamGeo, beamMat);
      skyBeam.position.set(0, 8.5, 0);
      group.add(skyBeam);

      const pLight = new THREE.PointLight(isHazard ? 0xef4444 : 0x38bdf8, 2.0, 7.0);
      pLight.position.set(0, 0.8, 0);
      group.add(pLight);

      const initZ = -45 - i * 26;
      const initLane = i % 3;
      group.position.set(lanePositions[initLane], 0, initZ);

      scene.add(group);

      entityPool.push({
        group,
        mesh,
        skyBeam,
        light: pLight,
        isHazard,
        laneIndex: initLane,
        z: initZ,
        active: true,
        nearMissed: false,
      });
    }

    const resetEntity = (item: RoadFighterEntity, zPos: number, lane: number, isHazard: boolean) => {
      item.z = zPos;
      item.laneIndex = lane;
      item.isHazard = isHazard;
      item.active = true;
      item.nearMissed = false;
      item.group.visible = true;

      item.mesh.geometry = isHazard ? hazardGeo : coreGeo;
      const col = isHazard ? 0xef4444 : 0x38bdf8;
      (item.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(col);
      (item.skyBeam.material as THREE.MeshBasicMaterial).color.setHex(col);
      item.light.color.setHex(col);

      item.group.position.set(lanePositions[lane], 0, zPos);
    };

    `;

  code = code.substring(0, sIdx) + roadFighterEntities + code.substring(eIdx);
  fs.writeFileSync('src/components/F1GameCanvas.tsx', code, 'utf8');
  console.log('Successfully replaced old powerBlockPool with entityPool in F1GameCanvas.tsx');
} else {
  console.log('Markers not found');
}
