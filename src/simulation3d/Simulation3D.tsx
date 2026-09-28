import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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

  const stateRef = useRef(state);
  stateRef.current = state;

  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;

  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  const selectedObject = state.objects.find(o => o.id === state.selectedObjectId);
  const selectedObjectRef = useRef(selectedObject);
  selectedObjectRef.current = selectedObject;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0ea5e9);
    scene.fog = new THREE.FogExp2(0x0ea5e9, 0.004);

    // Camera
    const camera = new THREE.PerspectiveCamera(zoomLevelRef.current, width / height, 0.1, 1000);
    camera.position.set(30, 20, 40);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(100, 150, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0284c7, 1.5);
    scene.add(hemiLight);

    // Ocean
    const oceanGeo = new THREE.PlaneGeometry(350, 350, 40, 40);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.2,
      flatShading: true
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -1.2;
    scene.add(ocean);

    // Mountains
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, flatShading: true });
    for (let i = 0; i < 4; i++) {
      const mGeo = new THREE.ConeGeometry(25 + i * 10, 18 + i * 5, 5);
      const mMesh = new THREE.Mesh(mGeo, mountainMat);
      const angle = (i / 4) * Math.PI * 2 + 0.5;
      mMesh.position.set(Math.cos(angle) * 120, 6, Math.sin(angle) * 120);
      scene.add(mMesh);
    }

    // Ship Group
    const shipGroup = new THREE.Group();
    scene.add(shipGroup);

    // Flat Water Wake / Foam trail lying flush with sea surface behind ship
    const wakeGeo = new THREE.PlaneGeometry(4, 16);
    wakeGeo.rotateX(-Math.PI / 2);
    const wakeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const wakeMesh = new THREE.Mesh(wakeGeo, wakeMat);
    const wakeGroup = new THREE.Group();
    wakeGroup.add(wakeMesh);
    scene.add(wakeGroup);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/PV26_Gepard39_Detailed.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.22, 0.22, 0.22);
        model.rotation.y = 0;
        model.position.set(0, 0, 0);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        shipGroup.add(model);
      },
      undefined,
      (error) => {
        console.error('Error loading PV26_Gepard39_Detailed.glb:', error);
        const fallbackGeo = new THREE.BoxGeometry(4.2, 2.0, 16);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
        const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        fallbackMesh.position.y = 1.0;
        shipGroup.add(fallbackMesh);
      }
    );

    const objectMeshMap = new Map<string, THREE.Group>();
    const tracerLinesMap = new Map<string, THREE.Line>();

    // Orbit state
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let spherical = { radius: zoomLevelRef.current, theta: Math.PI / 4, phi: Math.PI / 3 };
    let targetLookAt = new THREE.Vector3(0, 0, 0);

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      if (cameraModeRef.current !== 'free') return;

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

      camera.fov = zoomLevelRef.current;
      camera.updateProjectionMatrix();

      const positions = oceanGeo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const px = positions.getX(i);
        const py = positions.getY(i);
        positions.setZ(i, Math.sin(px * 0.12 + t) * Math.cos(py * 0.12 + t) * 0.35);
      }
      oceanGeo.attributes.position.needsUpdate = true;

      const currentState = stateRef.current;
      const ownShipObj = currentState.objects.find(o => o.type === 'OWN_SHIP');
      if (ownShipObj) {
        const shipX = ownShipObj.position.x * 2;
        const shipZ = ownShipObj.position.y * 2;
        const headingRad = (ownShipObj.heading * Math.PI) / 180;

        shipGroup.position.x = shipX;
        shipGroup.position.z = shipZ;
        shipGroup.rotation.y = headingRad;
        shipGroup.position.y = -0.3 + Math.sin(t * 4) * 0.12;
        shipGroup.rotation.x = Math.cos(t * 3) * 0.015;
        shipGroup.rotation.z = Math.sin(t * 3.5) * 0.012;

        const wakeDist = -10;
        wakeGroup.position.set(
          shipX + Math.sin(headingRad) * wakeDist,
          -1.15,
          shipZ + Math.cos(headingRad) * wakeDist
        );
        wakeGroup.rotation.y = headingRad;
        wakeMat.opacity = 0.25 + Math.sin(t * 8) * 0.15;
      }

      // Sync object meshes
      const currentObjIds = new Set<string>();
      currentState.objects.forEach(obj => {
        if (obj.type === 'OWN_SHIP') return;
        currentObjIds.add(obj.id);

        let group = objectMeshMap.get(obj.id);
        if (!group) {
          const newGroup = new THREE.Group();
          if (obj.type === 'UAV') {
            const uavBodyGeo = new THREE.BoxGeometry(1.0, 0.3, 1.0);
            const uavMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, flatShading: true });
            const body = new THREE.Mesh(uavBodyGeo, uavMat);
            newGroup.add(body);

            [-0.6, 0.6].forEach(rx => {
              [-0.6, 0.6].forEach(rz => {
                const rotorGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8);
                const rotorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, flatShading: true });
                const rotor = new THREE.Mesh(rotorGeo, rotorMat);
                rotor.position.set(rx, 0.2, rz);
                newGroup.add(rotor);
              });
            });
            newGroup.scale.set(0.35, 0.35, 0.35);
          } else if (obj.type === 'USV') {
            const boatGeo = new THREE.BoxGeometry(1.5, 0.8, 3.5);
            const boatMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, flatShading: true });
            const boat = new THREE.Mesh(boatGeo, boatMat);
            newGroup.add(boat);

            const cabinGeo = new THREE.BoxGeometry(1.0, 0.6, 1.2);
            const cabinMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, flatShading: true });
            const cabin = new THREE.Mesh(cabinGeo, cabinMat);
            cabin.position.set(0, 0.7, 0.2);
            newGroup.add(cabin);
            newGroup.scale.set(0.45, 0.45, 0.45);
          } else {
            const markerGeo = new THREE.OctahedronGeometry(1.0);
            const markerMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.2, flatShading: true });
            const marker = new THREE.Mesh(markerGeo, markerMat);
            newGroup.add(marker);
          }
          scene.add(newGroup);
          objectMeshMap.set(obj.id, newGroup);
          group = newGroup;
        }

        group.position.x = obj.position.x * 2;
        group.position.z = obj.position.y * 2;
        if (obj.status === 'ĐÃ NỔ / VA CHẠM' || obj.status === 'ĐÃ TIÊU DIỆT') {
          group.position.y = 0;
        } else {
          group.position.y = obj.type === 'UAV' ? (obj.altitude ? obj.altitude / 40 : 0) : 0;
        }
        group.rotation.y = (obj.heading * Math.PI) / 180;

        if (obj.status === 'ĐÃ NỔ / VA CHẠM' || obj.status === 'ĐÃ TIÊU DIỆT') {
          const pulse = 2.2 + Math.sin(t * 12) * 0.4;
          group.scale.set(pulse, pulse, pulse);
          group.traverse(child => {
            if ((child as THREE.Mesh).material) {
              const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              mat.color.setHex(0xff2200);
              mat.emissive.setHex(0xffaa00);
              mat.emissiveIntensity = 1.0;
            }
          });
        } else {
          const baseScale = obj.type === 'UAV' ? 0.35 : obj.type === 'USV' ? 0.45 : 1.0;
          group.scale.set(baseScale, baseScale, baseScale);
          group.traverse(child => {
            if ((child as THREE.Mesh).material) {
              const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (obj.type === 'UAV') {
                mat.color.setHex(0xef4444);
              } else if (obj.type === 'USV') {
                mat.color.setHex(0xf59e0b);
              } else {
                mat.color.setHex(0xa855f7);
              }
              mat.emissive.setHex(0x000000);
              mat.emissiveIntensity = 0;
            }
          });
        }
      });

      // Remove deleted object meshes
      objectMeshMap.forEach((mesh, id) => {
        if (!currentObjIds.has(id)) {
          scene.remove(mesh);
          objectMeshMap.delete(id);
        }
      });

      // Render red tracer bullet beams from ship to targets when interception is active and within range
      const activeInterception = currentState.interceptionConfig?.active;
      const currentTracerIds = new Set<string>();

      if (activeInterception) {
        currentState.objects.forEach(obj => {
          if (obj.type === 'OWN_SHIP' || obj.status === 'ĐÃ TIÊU DIỆT' || obj.status === 'ĐÃ NỔ / VA CHẠM') return;
          const rangeKm = obj.range !== undefined ? obj.range : Math.sqrt(obj.position.x * obj.position.x + obj.position.y * obj.position.y);
          if (rangeKm <= 4.5) {
            currentTracerIds.add(obj.id);
            let line = tracerLinesMap.get(obj.id);
            if (!line) {
              const geom = new THREE.BufferGeometry();
              const mat = new THREE.LineBasicMaterial({
                color: 0xff0033,
                transparent: true,
                opacity: 0.9,
                linewidth: 3
              });
              line = new THREE.Line(geom, mat);
              scene.add(line);
              tracerLinesMap.set(obj.id, line);
            }

            const targetGroup = objectMeshMap.get(obj.id);
            if (targetGroup) {
              const shipPos = shipGroup.position.clone().add(new THREE.Vector3(0, 2.0, 0));
              const targetPos = targetGroup.position.clone();
              const points = [shipPos, targetPos];
              line.geometry.setFromPoints(points);
              (line.material as THREE.LineBasicMaterial).opacity = 0.5 + Math.sin(t * 30 + obj.id.charCodeAt(0)) * 0.4;
              line.visible = true;
            }
          }
        });
      }

      tracerLinesMap.forEach((line, id) => {
        if (!currentTracerIds.has(id) || !activeInterception) {
          scene.remove(line);
          line.geometry.dispose();
          (line.material as THREE.Material).dispose();
          tracerLinesMap.delete(id);
        }
      });

      const mode = cameraModeRef.current;
      const selObj = selectedObjectRef.current;

      if (mode === 'top') {
        camera.position.set(0, 70, 0.1);
        camera.lookAt(0, 0, 0);
      } else if (mode === 'ship') {
        const shipPos = shipGroup.position;
        camera.position.set(shipPos.x - 18 * Math.sin(shipGroup.rotation.y), shipPos.y + 5, shipPos.z - 22 * Math.cos(shipGroup.rotation.y));
        camera.lookAt(shipPos.x, shipPos.y + 1.5, shipPos.z);
      } else if (mode === 'target' && selObj && selObj.type !== 'OWN_SHIP') {
        const targetGroup = objectMeshMap.get(selObj.id);
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
  }, []);

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
          <button
            onClick={() => {
              try {
                const canvas = containerRef.current?.querySelector('canvas');
                if (canvas) {
                  const url = canvas.toDataURL('image/png');
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `pv26-tactical-3d-${Date.now().toString().slice(-4)}.png`;
                  a.click();
                }
              } catch (err) {
                console.error(err);
              }
            }}
            className="p-2 rounded-lg bg-[#050b1a] border border-cyan-950 text-slate-300 hover:text-white transition-colors"
            title="Chụp ảnh màn hình 3D"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
          </button>
          <div className="h-[1px] w-full bg-cyan-950"></div>
          <button
            onClick={() => {
              if (containerRef.current) {
                if (!document.fullscreenElement) {
                  containerRef.current.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }
            }}
            className="p-2 rounded-lg bg-[#050b1a] border border-cyan-950 text-slate-300 hover:text-white transition-colors"
            title="Toàn màn hình"
          >
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
