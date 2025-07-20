'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function BouncingBall() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("beige");

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;
    camera.position.y = 2;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // Ground
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Ball
    const ballGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xff5555 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.y = 2;
    scene.add(ball);

    // Animation State
    let velocity = 0;
    const gravity = -0.004;
    const bounce = 0.7;
    const floor = 0.9;

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function animate() {
      velocity += gravity;
      ball.position.y += velocity;

      if (ball.position.y <= floor) {
        ball.position.y = floor;
        velocity = -velocity * bounce;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // Click handler to bounce the ball again
    function onMouseDown(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(ball);
      if (intersects.length > 0) {
        velocity = 0.2; // Reset velocity to bounce again
      }
    }
    renderer.domElement.addEventListener('mousedown', onMouseDown);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (mountRef.current) {
        window.removeEventListener('resize', handleResize);
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-screen"></div>;
}
