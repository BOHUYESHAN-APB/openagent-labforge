/**
 * 3D DNA Helix using Three.js
 * Creates a rotating double helix in 3D space
 */

class DNAHelix {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      alpha: true,
      antialias: true 
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.helixGroup = new THREE.Group();
    this.scene.add(this.helixGroup);
    
    this.camera.position.z = 30;
    
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.init();
    this.animate();
    this.addEventListeners();
  }
  
  init() {
    // Create DNA strands
    this.createStrands();
    // Create base pairs
    this.createBasePairs();
    // Create nucleotides labels
    this.createLabels();
    // Add ambient light
    this.addLights();
  }
  
  createStrands() {
    const strandGeometry = new THREE.TubeGeometry(
      this.createHelixCurve(0),
      200,
      0.3,
      8,
      false
    );
    
    const strand2Geometry = new THREE.TubeGeometry(
      this.createHelixCurve(Math.PI),
      200,
      0.3,
      8,
      false
    );
    
    const material1 = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.3,
      shininess: 100
    });
    
    const material2 = new THREE.MeshPhongMaterial({
      color: 0x7b61ff,
      emissive: 0x7b61ff,
      emissiveIntensity: 0.3,
      shininess: 100
    });
    
    this.strand1 = new THREE.Mesh(strandGeometry, material1);
    this.strand2 = new THREE.Mesh(strand2Geometry, material2);
    
    this.helixGroup.add(this.strand1);
    this.helixGroup.add(this.strand2);
  }
  
  createHelixCurve(phase) {
    const points = [];
    const height = 40;
    const radius = 5;
    const turns = 3;
    
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const angle = t * Math.PI * 2 * turns + phase;
      const x = Math.cos(angle) * radius;
      const y = (t - 0.5) * height;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return new THREE.CatmullRomCurve3(points);
  }
  
  createBasePairs() {
    const basePairs = 30;
    const height = 40;
    
    const bases = [
      { name: 'A-T', color1: 0xff6b6b, color2: 0x00ff88 },
      { name: 'G-C', color1: 0xffd700, color2: 0x00d4ff },
      { name: 'T-A', color1: 0x00ff88, color2: 0xff6b6b },
      { name: 'C-G', color1: 0x00d4ff, color2: 0xffd700 }
    ];
    
    this.basePairMeshes = [];
    
    for (let i = 0; i < basePairs; i++) {
      const t = i / basePairs;
      const y = (t - 0.5) * height;
      const angle = t * Math.PI * 6;
      const radius = 5;
      
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;
      
      const base = bases[i % 4];
      
      // Connection line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y, z1),
        new THREE.Vector3(x2, y, z2)
      ]);
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.3,
        transparent: true
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      this.helixGroup.add(line);
      
      // Base spheres
      const sphereGeometry = new THREE.SphereGeometry(0.4, 16, 16);
      
      const sphere1 = new THREE.Mesh(sphereGeometry, new THREE.MeshPhongMaterial({
        color: base.color1,
        emissive: base.color1,
        emissiveIntensity: 0.5
      }));
      sphere1.position.set(x1, y, z1);
      this.helixGroup.add(sphere1);
      
      const sphere2 = new THREE.Mesh(sphereGeometry, new THREE.MeshPhongMaterial({
        color: base.color2,
        emissive: base.color2,
        emissiveIntensity: 0.5
      }));
      sphere2.position.set(x2, y, z2);
      this.helixGroup.add(sphere2);
      
      this.basePairMeshes.push({ line, sphere1, sphere2, y });
    }
  }
  
  addLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 100);
    pointLight1.position.set(10, 10, 10);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x7b61ff, 1, 100);
    pointLight2.position.set(-10, -10, -10);
    this.scene.add(pointLight2);
  }
  
  createLabels() {
    // We'll use sprites for nucleotide labels
    const labels = ['A', 'T', 'G', 'C'];
    const colors = [0xff6b6b, 0x00ff88, 0xffd700, 0x00d4ff];
    
    labels.forEach((label, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 32, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        color: colors[i]
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(1.5, 1.5, 1.5);
      
      // Position along helix
      const t = (i * 0.25) + 0.125;
      const angle = t * Math.PI * 6;
      const radius = 7;
      const height = 40;
      
      sprite.position.set(
        Math.cos(angle) * radius,
        (t - 0.5) * height,
        Math.sin(angle) * radius
      );
      
      this.helixGroup.add(sprite);
    });
  }
  
  addEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    document.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Rotate helix
    this.helixGroup.rotation.y += 0.005;
    
    // Mouse interaction
    this.helixGroup.rotation.x = this.mouseY * 0.3;
    this.helixGroup.rotation.z = this.mouseX * 0.1;
    
    // Gentle floating
    this.helixGroup.position.y = Math.sin(Date.now() * 0.001) * 0.5;
    
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dnaHelix = new DNAHelix('bg-canvas');
});
