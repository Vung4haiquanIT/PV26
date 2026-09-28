import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimulationState, SimulationObject } from '../types';
import { Camera, Eye, Crosshair, Compass, RefreshCw, Sun, Maximize2, Sliders, Shield, Navigation, Mountain, Ruler, Layers } from 'lucide-react';

interface Simulation3DProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
}

export const Simulation3D: React.FC<Simulation3DProps> = ({ state }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraMode, setCameraMode] = useState<'free' | 'ship' | 'target' | 'top'>('ship');
  const [zoomLevel, setZoomLevel] = useState<number>(45);

  const selectedObject = state.objects.find(o => o.id === state.selectedObjectId);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b18);
    scene.fog = new THREE.FogExp2(0x060b18, 0.012);

    // Camera
    const camera = new THREE.PerspectiveCamera(zoomLevel, width / height, 0.1, 1000);
    camera.position.set(30, 20, 40);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xcfd8dc, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(50, 80, 40);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x050a18, 0.6);
    scene.add(hemiLight);

    // Ocean / Sea with distant mountains/islands as in reference image
    const oceanGeo = new THREE.PlaneGeometry(350, 350, 40, 40);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.1,
      flatShading: true
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.6;
    scene.add(ocean);

    // Distant low-poly islands/mountains in background
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, flatShading: true });
    for (let i = 0; i < 4; i++) {
      const mGeo = new THREE.ConeGeometry(25 + i * 10, 15 + i * 5, 5);
      const mMesh = new THREE.Mesh(mGeo, mountainMat);
      const angle = (i / 4) * Math.PI * 2 + 0.5;
      mMesh.position.set(Math.cos(angle) * 120, 5, Math.sin(angle) * 120);
      scene.add(mMesh);
    }

    // Materials for Warship
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.3, flatShading: true });
    const superstructureMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.4, flatShading: true });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, flatShading: true });
    const radarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, flatShading: true });

    // Build Own Ship Group
    const shipGroup = new THREE.Group();

    const hullGeo = new THREE.BoxGeometry(4.2, 2.0, 16);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 1.0;
    hull.castShadow = true;
    shipGroup.add(hull);

    const bowGeo = new THREE.ConeGeometry(2.1, 5, 4);
    const bow = new THREE.Mesh(bowGeo, hullMat);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(0, 1.0, 9.5);
    shipGroup.add(bow);

    const deckGeo = new THREE.BoxGeometry(4.0, 0.1, 15);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 2.05, 0.5);
    shipGroup.add(deck);

    const superGeo = new THREE.BoxGeometry(3.2, 2.8, 6);
    const superstructure = new THREE.Mesh(superGeo, superstructureMat);
    superstructure.position.set(0, 3.5, 1);
    shipGroup.add(superstructure);

    const mastGeo = new THREE.CylinderGeometry(0.2, 0.4, 4.5, 6);
    const mast = new THREE.Mesh(mastGeo, superstructureMat);
    mast.position.set(0, 6.25, 1);
    shipGroup.add(mast);

    const domeGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const dome = new THREE.Mesh(domeGeo, radarMat);
    dome.position.set(0, 8.7, 1);
    shipGroup.add(dome);

    scene.add(shipGroup);

    // Object meshes dictionary
    const objectMeshMap = new Map<string, THREE.Group>();

    state.objects.forEach((obj: SimulationObject) => {
      if (obj.type === 'OWN_SHIP') return;

      const group = new THREE.Group();

      if (obj.type === 'UAV') {
        const uavBodyGeo = new THREE.BoxGeometry(1.0, 0.3, 1.0);
        const uavMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, flatShading: true });
        const body = new THREE.Mesh(uavBodyGeo, uavMat);
        group.add(body);

        [-0.6, 0.6].forEach(rx => {
          [-0.6, 0.6].forEach(rz => {
            const rotorGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8);
            const rotorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, flatShading: true });
            const rotor = new THREE.Mesh(rotorGeo, rotorMat);
            rotor.position.set(rx, 0.2, rz);
            group.add(rotor);
          });
        });
      } else if (obj.type === 'USV') {
        const boatGeo = new THREE.BoxGeometry(1.5, 0.8, 3.5);
        const boatMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, flatShading: true });
        const boat = new THREE.Mesh(boatGeo, boatMat);
        group.add(boat);

        const cabinGeo = new THREE.BoxGeometry(1.0, 0.6, 1.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, flatShading: true });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 0.7, 0.2);
        group.add(cabin);
      } else {
        const markerGeo = new THREE.OctahedronGeometry(1.0);
        const markerMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.2, flatShading: true });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        group.add(marker);
      }

      scene.add(group);
      objectMeshMap.set(obj.id, group);
    });

    // Orbit state
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let spherical = { radius: zoomLevel, theta: Math.PI / 4, phi: Math.PI / 3 };
    let targetLookAt = new THREE.Vector3(0, 0, 0);

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      if (cameraMode !== 'free') return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      spherical.theta -= deltaX * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.008));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(10, Math.min(150, spherical.radius + e.deltaY * 0.05));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    let animationFrameId: number;
    let t = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      t += 0.02;

      const positions = oceanGeo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const px = positions.getX(i);
        const py = positions.getY(i);
        positions.setZ(i, Math.sin(px * 0.12 + t) * Math.cos(py * 0.12 + t) * 0.35);
      }
      oceanGeo.attributes.position.needsUpdate = true;

      const ownShipObj = state.objects.find(o => o.type === 'OWN_SHIP');
      if (ownShipObj) {
        shipGroup.position.x = ownShipObj.position.x * 2;
        shipGroup.position.z = ownShipObj.position.y * 2;
        shipGroup.rotation.y = (ownShipObj.heading * Math.PI) / 180;
      }

      state.objects.forEach(obj => {
        if (obj.type === 'OWN_SHIP') return;
        const mesh = objectMeshMap.get(obj.id);
        if (mesh) {
          mesh.position.x = obj.position.x * 2;
          mesh.position.z = obj.position.y * 2;
          mesh.position.y = obj.type === 'UAV' ? (obj.altitude ? obj.altitude / 40 : 10) : 0.5;
          mesh.rotation.y = (obj.heading * Math.PI) / 180;

          if (obj.status === 'ĐÃ NỔ / VA CHẠM') {
            mesh.scale.set(2.2, 2.2, 2.2);
            mesh.traverse(child => {
              if ((child as THREE.Mesh).material) {
                ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).color.setHex(0xff4500);
              }
            });
          }
        }
      });

      if (cameraMode === 'top') {
        camera.position.set(0, 70, 0.1);
        camera.lookAt(0, 0, 0);
      } else if (cameraMode === 'ship') {
        const shipPos = shipGroup.position;
        camera.position.set(shipPos.x - 12 * Math.sin(shipGroup.rotation.y), shipPos.y + 7, shipPos.z - 18 * Math.cos(shipGroup.rotation.y));
        camera.lookAt(shipPos.x, shipPos.y + 2, shipPos.z);
      } else if (cameraMode === 'target' && selectedObject && selectedObject.type !== 'OWN_SHIP') {
        const targetGroup = objectMeshMap.get(selectedObject.id);
        if (targetGroup) {
          const tPos = targetGroup.position;
          camera.position.set(tPos.x + 12, tPos.y + 8, tPos.z + 12);
          camera.lookAt(tPos);
        }
      } else {
        const x = targetLookAt.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
        const y = targetLookAt.y + spherical.radius * Math.cos(spherical.phi);
        const z = targetLookAt.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
        camera.position.set(x, y, z);
        camera.lookAt(targetLookAt);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cameraMode, state.objects, state.selectedObjectId, zoomLevel]);

  return (
    <div className="flex flex-col h-full bg-[#070e22] rounded-lg overflow-hidden border border-cyan-900/50 shadow-2xl relative">
      {/* Top Toolbar matching image */}
      <div className="bg-[#050b1a] px-4 py-2.5 border-b border-cyan-900/60 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-200 font-mono">KHÔNG GIAN CHIẾN THUẬT 3D</h2>
        </div>
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setCameraMode('ship')}
            className={`px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-all ${
              cameraMode === 'ship' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Xem tàu
          </button>
          <button
            onClick={() => setCameraMode('free')}
            className={`px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-all ${
              cameraMode === 'free' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Góc tự do
          </button>
          <button
            onClick={() => setCameraMode('target')}
            className={`px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-all ${
              cameraMode === 'target' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" /> Theo mục tiêu
          </button>
          <button
            onClick={() => setCameraMode('top')}
            className={`px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-all ${
              cameraMode === 'top' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Quỹ đạo
          </button>
          <button
            onClick={() => {}}
            className="px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-all"
          >
            <Sun className="w-3.5 h-3.5" /> Môi trường
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full relative overflow-hidden bg-[#030712]">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Left Floating Toolbar matching image */}
        <div className="absolute top-4 left-4 bg-[#030712]/90 border border-cyan-900/60 p-1.5 rounded-xl flex flex-col space-y-1 z-20 shadow-xl backdrop-blur">
          <button className="flex flex-col items-center p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-200 text-[10px] font-mono hover:bg-cyan-900 w-16">
            <Shield className="w-4 h-4 mb-1 text-cyan-400" /> Tàu
          </button>
          <button className="flex flex-col items-center p-2 rounded-lg bg-[#050b1a] border border-cyan-950 text-slate-300 text-[10px] font-mono hover:bg-slate-800 w-16">
            <Crosshair className="w-4 h-4 mb-1 text-rose-400" /> UAV
          </button>
          <button className="flex flex-col items-center p-2 rounded-lg bg-[#050b1a] border border-cyan-950 text-slate-300 text-[10px] font-mono hover:bg-slate-800 w-16">
            <Navigation className="w-4 h-4 mb-1 text-amber-400" /> USV
          </button>
          <div className="h-[1px] bg-cyan-950 my-1"></div>
          <button className="flex flex-col items-center p-2 rounded-lg bg-[#050b1a] border border-cyan-950 text-slate-300 text-[10px] font-mono hover:bg-slate-800 w-16">
            <Mountain className="w-4 h-4 mb-1 text-emerald-400" /> Đảo/Địa hình
          </button>
          <button className="flex flex-col items-center p-2 rounded-lg bg-[#050b1a] border border-cyan-950 text-slate-300 text-[10px] font-mono hover:bg-slate-800 w-16">
            <Layers className="w-4 h-4 mb-1 text-purple-400" /> Khung nhìn
          </button>
          <button className="flex flex-col items-center p-2 rounded-lg bg-[#050b1a] border border-cyan-950 text-slate-300 text-[10px] font-mono hover:bg-slate-800 w-16">
            <Ruler className="w-4 h-4 mb-1 text-blue-400" /> Đo cự ly
          </button>
          <button className="flex flex-col items-center p-2 rounded-lg bg-[#050b1a] border border-cyan-950 text-slate-300 text-[10px] font-mono hover:bg-slate-800 w-16">
            <Sliders className="w-4 h-4 mb-1 text-slate-300" /> Hiển thị
          </button>
        </div>

        {/* Top-Right Weather Widget matching image */}
        <div className="absolute top-4 right-4 bg-[#030712]/95 border border-cyan-900/60 px-4 py-3 rounded-xl flex items-center space-x-3 z-20 shadow-xl backdrop-blur font-mono text-xs">
          <Sun className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
          <div>
            <div className="text-white font-bold flex items-center gap-2">
              <span>10:30:15</span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-0.5 mt-0.5">
              <div>Thời tiết: Tốt</div>
              <div>Sóng cấp: {state.environment.seaState}</div>
              <div>Tầm nhìn: &gt; {state.environment.visibility} km</div>
            </div>
          </div>
        </div>

        {/* Right Floating Zoom/Camera Controls matching image */}
        <div className="absolute right-4 bottom-12 bg-[#030712]/90 border border-cyan-900/60 p-2 rounded-xl flex flex-col items-center space-y-3 z-20 shadow-xl backdrop-blur">
          <button className="p-2 rounded-lg bg-[#050b1a] border border-cyan-950 text-slate-300 hover:text-white" title="Chụp ảnh màn hình">
            <Camera className="w-4 h-4 text-cyan-400" />
          </button>
          <div className="h-[1px] w-full bg-cyan-950"></div>
          <button className="p-2 rounded-lg bg-[#050b1a] border border-cyan-950 text-slate-300 hover:text-white" title="Toàn màn hình">
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="h-[1px] w-full bg-cyan-950"></div>
          <div className="flex flex-col items-center space-y-2 py-1">
            <span className="text-[10px] font-mono text-slate-400">Xa</span>
            <input
              type="range"
              min="20"
              max="90"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="h-24 accent-cyan-500 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
            />
            <span className="text-[10px] font-mono text-slate-400">Gần</span>
          </div>
        </div>
      </div>
    </div>
  );
};
