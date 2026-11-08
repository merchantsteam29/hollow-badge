// Post-processing for Medium/High quality: bloom, then a film grade.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// grade: cold shadows / warm highlights, gentle contrast, lens vignette, grain, slight colour fringing
export const GradeShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vignette: { value: 0.6 }, grain: { value: 0.045 }, aberr: { value: 0.0007 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, vignette, grain, aberr; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 d = vUv - 0.5; float r2 = dot(d, d);
      vec3 col = vec3(texture2D(tDiffuse, vUv + d * aberr * 4.0).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * aberr * 4.0).b);
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, col * vec3(0.86, 0.98, 1.12), smoothstep(0.45, 0.0, l) * 0.7);
      col = mix(col, col * vec3(1.08, 1.0, 0.88), smoothstep(0.3, 0.9, l) * 0.55);
      col = (col - 0.5) * 1.07 + 0.5;
      col *= 1.0 - vignette * smoothstep(0.08, 0.55, r2 * 1.7);
      col += (hash(vUv * 1000.0 + time) - 0.5) * grain;
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }`,
};

export function createComposer(renderer, scene, camera, { bloom, msaa }) {
  const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: msaa || 0 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight);
  const renderPass = new RenderPass(scene, camera); composer.addPass(renderPass);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), bloom, 0.5, 0.9));
  composer.addPass(new OutputPass());
  const gradePass = new ShaderPass(GradeShader); composer.addPass(gradePass);
  return { composer, renderPass, gradePass };
}
