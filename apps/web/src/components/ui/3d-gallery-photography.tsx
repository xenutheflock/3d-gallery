import type React from 'react';
import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

type ImageItem = string | { src: string; alt?: string };

interface FadeSettings {
	fadeIn: {
		start: number;
		end: number;
	};
	fadeOut: {
		start: number;
		end: number;
	};
}

interface BlurSettings {
	blurIn: {
		start: number;
		end: number;
	};
	blurOut: {
		start: number;
		end: number;
	};
	maxBlur: number;
}

interface InfiniteGalleryProps {
	images: ImageItem[];
	speed?: number;
	zSpacing?: number;
	visibleCount?: number;
	falloff?: { near: number; far: number };
	fadeSettings?: FadeSettings;
	blurSettings?: BlurSettings;
	className?: string;
	style?: React.CSSProperties;
}

interface PlaneData {
	index: number;
	z: number;
	imageIndex: number;
	x: number;
	y: number; 
}

const DEFAULT_DEPTH_RANGE = 42;
const MAX_HORIZONTAL_OFFSET = 6.8;
const MAX_VERTICAL_OFFSET = 3.8;
const BASE_IMAGE_HEIGHT = 3.8;

const createClothMaterial = () => {
	return new THREE.ShaderMaterial({
		transparent: true,
		uniforms: {
			map: { value: null },
			opacity: { value: 1.0 },
			blurAmount: { value: 0.0 },
			scrollForce: { value: 0.0 },
			time: { value: 0.0 },
			isHovered: { value: 0.0 },
		},
		vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vNormal = normal;
        
        vec3 pos = position;
        
        // Create smooth curving based on scroll force
        float curveIntensity = scrollForce * 0.3;
        
        // Base curve across the plane based on distance from center
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;
        
        // Add gentle cloth-like ripples
        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;
        
        // Flag waving effect when hovered
        float flagWave = 0.0;
        if (isHovered > 0.5) {
          // Create flag-like wave from left to right
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float waveAmplitude = sin(wavePhase) * 0.1;
          // Damping effect - stronger wave on the right side (free edge)
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = waveAmplitude * dampening;
          
          // Add secondary smaller waves for more realistic flag motion
          float secondaryWave = sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
          flagWave += secondaryWave;
        }
        
        // Apply Z displacement for curving effect (inverted) with cloth ripples and flag wave
        pos.z -= (curve + clothEffect + flagWave);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
		fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vec4 color = texture2D(map, vUv);
        
        // Simple blur approximation
        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;
          
          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }
        
        // Add subtle lighting effect based on curving
        float curveHighlight = abs(scrollForce) * 0.05;
        color.rgb += vec3(curveHighlight * 0.1);
        
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
	});
};

function ImagePlane({
	texture,
	position,
	scale,
	material,
}: {
	texture: THREE.Texture;
	position: [number, number, number];
	scale: [number, number, number];
	material: THREE.ShaderMaterial;
}) {
	const meshRef = useRef<THREE.Mesh>(null);
	const [isHovered, setIsHovered] = useState(false);

	useEffect(() => {
		if (material && texture) {
			material.uniforms.map.value = texture;
		}
	}, [material, texture]);

	useEffect(() => {
		if (material && material.uniforms) {
			material.uniforms.isHovered.value = isHovered ? 1.0 : 0.0;
		}
	}, [material, isHovered]);

	return (
		<mesh
			ref={meshRef}
			position={position}
			scale={scale}
			material={material}
			onPointerEnter={() => setIsHovered(true)}
			onPointerLeave={() => setIsHovered(false)}
		>
			<planeGeometry args={[1, 1, 32, 32]} />
		</mesh>
	);
}

function GalleryScene({
	images,
	speed = 1,
	visibleCount = 8,
	fadeSettings = {
		fadeIn: { start: 0.05, end: 0.15 },
		fadeOut: { start: 0.85, end: 0.95 },
	},
	blurSettings = {
		blurIn: { start: 0.0, end: 0.1 },
		blurOut: { start: 0.9, end: 1.0 },
		maxBlur: 3.0,
	},
}: Omit<InfiniteGalleryProps, 'className' | 'style'>) {
	const [scrollVelocity, setScrollVelocity] = useState(0);
	const [autoPlay, setAutoPlay] = useState(true);
	const lastInteraction = useRef(Date.now());
	const pointerState = useRef({
		isDragging: false,
		lastY: 0,
	});

	const normalizedImages = useMemo(
		() =>
			images.map((img) =>
				typeof img === 'string' ? { src: img, alt: '' } : img
			),
		[images]
	);

	const textures = useTexture(normalizedImages.map((img) => img.src));

	// Create materials pool
	const materials = useMemo(
		() => Array.from({ length: visibleCount }, () => createClothMaterial()),
		[visibleCount]
	);

	const spatialPositions = useMemo(() => {
		const positions: { x: number; y: number }[] = [];
		const layout = [
			{ x: -0.75, y: 0.45 },
			{ x: 0.7, y: -0.35 },
			{ x: 0.05, y: 0.05 },
			{ x: -0.45, y: -0.65 },
			{ x: 0.8, y: 0.55 },
			{ x: -0.95, y: -0.1 },
		];

		for (let i = 0; i < visibleCount; i++) {
			const point = layout[i % layout.length];
			const x = point.x * MAX_HORIZONTAL_OFFSET;
			const y = point.y * MAX_VERTICAL_OFFSET;

			positions.push({ x, y });
		}

		return positions;
	}, [visibleCount]);

	const totalImages = normalizedImages.length;
	const depthRange = DEFAULT_DEPTH_RANGE;

	const createPlanes = useCallback(
		() =>
			Array.from({ length: visibleCount }, (_, i) => ({
				index: i,
				z:
					visibleCount > 0
						? 4 +
							((Math.max(depthRange - 8, 1) / Math.max(visibleCount - 1, 1)) *
								i)
						: 0,
				imageIndex: totalImages > 0 ? i % totalImages : 0,
				x: spatialPositions[i]?.x ?? 0,
				y: spatialPositions[i]?.y ?? 0,
			})),
		[depthRange, spatialPositions, totalImages, visibleCount]
	);

	const [planesData, setPlanesData] = useState<PlaneData[]>(createPlanes);

	useEffect(() => {
		setPlanesData(createPlanes());
	}, [createPlanes]);

	// Handle scroll input
	const handleWheel = useCallback(
		(event: WheelEvent) => {
			event.preventDefault();
			setScrollVelocity((prev) => prev + event.deltaY * 0.01 * speed);
			setAutoPlay(false);
			lastInteraction.current = Date.now();
		},
		[speed]
	);

	// Handle mobile touch / pointer drag input
	const handlePointerDown = useCallback((event: PointerEvent) => {
		pointerState.current = {
			isDragging: true,
			lastY: event.clientY,
		};
		setAutoPlay(false);
		lastInteraction.current = Date.now();
	}, []);

	const handlePointerMove = useCallback(
		(event: PointerEvent) => {
			if (!pointerState.current.isDragging) return;

			event.preventDefault();
			const deltaY = pointerState.current.lastY - event.clientY;
			pointerState.current.lastY = event.clientY;

			setScrollVelocity((prev) => prev + deltaY * 0.045 * speed);
			setAutoPlay(false);
			lastInteraction.current = Date.now();
		},
		[speed]
	);

	const handlePointerUp = useCallback(() => {
		pointerState.current.isDragging = false;
		lastInteraction.current = Date.now();
	}, []);

	// Handle keyboard input
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
				setScrollVelocity((prev) => prev - 2 * speed);
				setAutoPlay(false);
				lastInteraction.current = Date.now();
			} else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
				setScrollVelocity((prev) => prev + 2 * speed);
				setAutoPlay(false);
				lastInteraction.current = Date.now();
			}
		},
		[speed]
	);

	useEffect(() => {
		const canvas = document.querySelector('canvas');
		if (canvas) {
			canvas.addEventListener('wheel', handleWheel, { passive: false });
			canvas.addEventListener('pointerdown', handlePointerDown);
			canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
			canvas.addEventListener('pointerup', handlePointerUp);
			canvas.addEventListener('pointercancel', handlePointerUp);
			canvas.addEventListener('pointerleave', handlePointerUp);
			document.addEventListener('keydown', handleKeyDown);

			return () => {
				canvas.removeEventListener('wheel', handleWheel);
				canvas.removeEventListener('pointerdown', handlePointerDown);
				canvas.removeEventListener('pointermove', handlePointerMove);
				canvas.removeEventListener('pointerup', handlePointerUp);
				canvas.removeEventListener('pointercancel', handlePointerUp);
				canvas.removeEventListener('pointerleave', handlePointerUp);
				document.removeEventListener('keydown', handleKeyDown);
			};
		}
	}, [handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown]);

	// Auto-play logic
	useEffect(() => {
		const interval = setInterval(() => {
			if (Date.now() - lastInteraction.current > 3000) {
				setAutoPlay(true);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	useFrame((state, delta) => {
		// Apply auto-play
		if (autoPlay) {
			setScrollVelocity((prev) => prev - 0.3 * delta);
		}

		// Damping
		setScrollVelocity((prev) => prev * 0.95);

		// Update time uniform for all materials
		const time = state.clock.getElapsedTime();
		materials.forEach((material) => {
			if (material && material.uniforms) {
				material.uniforms.time.value = time;
				material.uniforms.scrollForce.value = scrollVelocity;
			}
		});

		// Update plane positions
		const imageAdvance =
			totalImages > 0 ? visibleCount % totalImages || totalImages : 0;
		const totalRange = depthRange;

		setPlanesData((currentPlanes) =>
			currentPlanes.map((plane, i) => {
			let newZ = plane.z + scrollVelocity * delta * 10;
			let wrapsForward = 0;
			let wrapsBackward = 0;
			let imageIndex = plane.imageIndex;

			if (newZ >= totalRange) {
				wrapsForward = Math.floor(newZ / totalRange);
				newZ -= totalRange * wrapsForward;
			} else if (newZ < 0) {
				wrapsBackward = Math.ceil(-newZ / totalRange);
				newZ += totalRange * wrapsBackward;
			}

			if (wrapsForward > 0 && imageAdvance > 0 && totalImages > 0) {
				imageIndex = (imageIndex + wrapsForward * imageAdvance) % totalImages;
			}

			if (wrapsBackward > 0 && imageAdvance > 0 && totalImages > 0) {
				const step = imageIndex - wrapsBackward * imageAdvance;
				imageIndex = ((step % totalImages) + totalImages) % totalImages;
			}

			const z = ((newZ % totalRange) + totalRange) % totalRange;
			const x = spatialPositions[i]?.x ?? 0;
			const y = spatialPositions[i]?.y ?? 0;

			// Calculate opacity based on fade settings
			const normalizedPosition = z / totalRange; // 0 to 1
			let opacity = 1;

			if (
				normalizedPosition >= fadeSettings.fadeIn.start &&
				normalizedPosition <= fadeSettings.fadeIn.end
			) {
				// Fade in: opacity goes from 0 to 1 within the fade in range
				const fadeInProgress =
					(normalizedPosition - fadeSettings.fadeIn.start) /
					(fadeSettings.fadeIn.end - fadeSettings.fadeIn.start);
				opacity = fadeInProgress;
			} else if (normalizedPosition < fadeSettings.fadeIn.start) {
				// Before fade in starts: fully transparent
				opacity = 0;
			} else if (
				normalizedPosition >= fadeSettings.fadeOut.start &&
				normalizedPosition <= fadeSettings.fadeOut.end
			) {
				// Fade out: opacity goes from 1 to 0 within the fade out range
				const fadeOutProgress =
					(normalizedPosition - fadeSettings.fadeOut.start) /
					(fadeSettings.fadeOut.end - fadeSettings.fadeOut.start);
				opacity = 1 - fadeOutProgress;
			} else if (normalizedPosition > fadeSettings.fadeOut.end) {
				// After fade out ends: fully transparent
				opacity = 0;
			}

			// Clamp opacity between 0 and 1
			opacity = Math.max(0, Math.min(1, opacity));

			// Calculate blur based on blur settings
			let blur = 0;

			if (
				normalizedPosition >= blurSettings.blurIn.start &&
				normalizedPosition <= blurSettings.blurIn.end
			) {
				// Blur in: blur goes from maxBlur to 0 within the blur in range
				const blurInProgress =
					(normalizedPosition - blurSettings.blurIn.start) /
					(blurSettings.blurIn.end - blurSettings.blurIn.start);
				blur = blurSettings.maxBlur * (1 - blurInProgress);
			} else if (normalizedPosition < blurSettings.blurIn.start) {
				// Before blur in starts: full blur
				blur = blurSettings.maxBlur;
			} else if (
				normalizedPosition >= blurSettings.blurOut.start &&
				normalizedPosition <= blurSettings.blurOut.end
			) {
				// Blur out: blur goes from 0 to maxBlur within the blur out range
				const blurOutProgress =
					(normalizedPosition - blurSettings.blurOut.start) /
					(blurSettings.blurOut.end - blurSettings.blurOut.start);
				blur = blurSettings.maxBlur * blurOutProgress;
			} else if (normalizedPosition > blurSettings.blurOut.end) {
				// After blur out ends: full blur
				blur = blurSettings.maxBlur;
			}

			// Clamp blur to reasonable values
			blur = Math.max(0, Math.min(blurSettings.maxBlur, blur));

			// Update material uniforms
			const material = materials[i];
			if (material && material.uniforms) {
				material.uniforms.opacity.value = opacity;
				material.uniforms.blurAmount.value = blur;
			}

			return { ...plane, imageIndex, x, y, z };
			})
		);
	});

	if (normalizedImages.length === 0) return null;

	return (
		<>
			{planesData.map((plane, i) => {
				const texture = textures[plane.imageIndex];
				const material = materials[i];

				if (!texture || !material) return null;

				const worldZ = -plane.z;

				// Calculate scale to maintain aspect ratio
				const image = texture.image as { width?: number; height?: number } | undefined;
				const aspect =
					image?.width && image?.height ? image.width / image.height : 1;
				const scale: [number, number, number] =
					aspect > 1
						? [BASE_IMAGE_HEIGHT * aspect, BASE_IMAGE_HEIGHT, 1]
						: [BASE_IMAGE_HEIGHT, BASE_IMAGE_HEIGHT / aspect, 1];

				return (
					<ImagePlane
						key={plane.index}
						texture={texture}
						position={[plane.x, plane.y, worldZ]} // Position planes relative to camera center
						scale={scale}
						material={material}
					/>
				);
			})}
		</>
	);
}

// Fallback component for when WebGL is not available
function FallbackGallery({ images }: { images: ImageItem[] }) {
	const normalizedImages = useMemo(
		() =>
			images.map((img) =>
				typeof img === 'string' ? { src: img, alt: '' } : img
			),
		[images]
	);

	return (
		<div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
			<p className="text-gray-600 mb-4">
				WebGL not supported. Showing image list:
			</p>
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
				{normalizedImages.map((img, i) => (
					<img
						key={i}
						src={img.src || '/placeholder.svg'}
						alt={img.alt}
						className="w-full h-32 object-cover rounded"
					/>
				))}
			</div>
		</div>
	);
}

export default function InfiniteGallery({
	images,
	speed,
	visibleCount,
	className = 'h-96 w-full',
	style,
	fadeSettings = {
		fadeIn: { start: 0.08, end: 0.22 },
		fadeOut: { start: 0.62, end: 0.78 },
	},
	blurSettings = {
		blurIn: { start: 0.08, end: 0.22 },
		blurOut: { start: 0.62, end: 0.78 },
		maxBlur: 1.8,
	},
}: InfiniteGalleryProps) {
	const [webglSupported, setWebglSupported] = useState(true);

	useEffect(() => {
		// Check WebGL support
		try {
			const canvas = document.createElement('canvas');
			const gl =
				canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			if (!gl) {
				setWebglSupported(false);
			}
		} catch (e) {
			setWebglSupported(false);
		}
	}, []);

	if (!webglSupported) {
		return (
			<div className={className} style={style}>
				<FallbackGallery images={images} />
			</div>
		);
	}

	return (
		<div
			className={className}
			style={{
				width: '100vw',
				height: '100vh',
				minHeight: '100vh',
				position: 'fixed',
				inset: 0,
				overflow: 'hidden',
				background: '#030303',
				...style,
			}}
		>
			<Canvas
				camera={{ position: [0, 0, 10], fov: 55 }}
				gl={{ antialias: true, alpha: false }}
				style={{
					display: 'block',
					width: '100vw',
					height: '100vh',
					background: '#030303',
					touchAction: 'none',
					cursor: 'grab',
				}}
			>
				<color attach="background" args={["#030303"]} />
				<GalleryScene
					images={images}
					speed={speed}
					visibleCount={visibleCount}
					fadeSettings={fadeSettings}
					blurSettings={blurSettings}
				/>
			</Canvas>
		</div>
	);
}
