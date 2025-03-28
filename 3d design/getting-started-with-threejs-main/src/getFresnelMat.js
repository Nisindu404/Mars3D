import * as THREE from "three";

function getFresnelMat({rimHex = 0x9F5E28, facingHex = 0x4B3C2D } = {}) {
  const uniforms = {
    color1: { value: new THREE.Color(rimHex) },
    color2: { value: new THREE.Color(facingHex) },
    fresnelBias: { value: 0.1 },
    fresnelScale: { value: 1.0 },
    fresnelPower: { value: 4.0 },
    sunDirection: { value: new THREE.Vector3(-5, 3, 4).normalize() }, // Match the sunLight position from index.js
    glowIntensity: { value: 1.5 }
  };
  
  const vs = `
  uniform float fresnelBias;
  uniform float fresnelScale;
  uniform float fresnelPower;
  uniform vec3 sunDirection;
  
  varying float vReflectionFactor;
  varying float vSunlightFactor;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  
    vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
  
    vec3 I = worldPosition.xyz - cameraPosition;
  
    // Fresnel effect calculation
    vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );
    
    // Calculate sunlight factor based on dot product of surface normal and sun direction
    vSunlightFactor = max(dot(worldNormal, sunDirection), 0.0);
  
    gl_Position = projectionMatrix * mvPosition;
  }
  `;
  
  const fs = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float glowIntensity;
  
  varying float vReflectionFactor;
  varying float vSunlightFactor;
  
  void main() {
    // Combine fresnel effect with sunlight factor
    float f = clamp(vReflectionFactor, 0.0, 1.0);
    float sunFactor = clamp(vSunlightFactor, 0.0, 1.0);
    
    // Mix colors based on both fresnel and sunlight
    vec3 glowColor = mix(color2, color1, vec3(f));
    
    // Modulate glow intensity by sunlight factor
    gl_FragColor = vec4(glowColor * sunFactor * glowIntensity, f * sunFactor);
  }
  `;
  
  const fresnelMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vs,
    fragmentShader: fs,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  
  return fresnelMat;
}

export { getFresnelMat };