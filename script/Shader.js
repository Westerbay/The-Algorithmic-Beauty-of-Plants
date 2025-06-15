class Shader {

    constructor() {}

    getVertexShaderBackground() {
        return `
            attribute vec3 aPosition;
            attribute vec2 aUV;
            attribute vec3 aNormal;
            attribute vec3 aTangent;

            uniform mat4 model;
            uniform mat4 cameraMatrix;

            varying vec2 vUV;
            varying vec3 vFragPos;
            varying mat3 vTBN;

            void main() {
                vec3 fragPos = (model * vec4(aPosition, 1.0)).xyz;
                vec3 normal = normalize(mat3(model) * aNormal);
                vec3 tangent = normalize(mat3(model) * aTangent);
                vec3 bitangent = normalize(cross(normal, tangent));

                vTBN = mat3(tangent, bitangent, normal);
                vFragPos = fragPos;
                vUV = aUV;
                gl_Position = cameraMatrix * vec4(fragPos, 1.0);
            }
        `;
    }


    getFragmentShaderBackground() {
        return `
            precision mediump float;

            varying vec2 vUV;
            varying vec3 vFragPos;
            varying mat3 vTBN;

            uniform sampler2D uDiffuseMap;
            uniform sampler2D uNormalMap;

            uniform vec3 uLightPos;
            uniform vec3 uViewPos;

            uniform bool uEnableLighting;

            void main() {

                vec3 albedo = texture2D(uDiffuseMap, vUV).rgb;

                if (!uEnableLighting) {
                    gl_FragColor = vec4(albedo, 1.0);
                    return;
                }

                vec3 normalMap = texture2D(uNormalMap, vUV).rgb;
                vec3 tangentNormal = normalize(normalMap * 2.0 - 1.0);
                vec3 normal = normalize(vTBN * tangentNormal);

                vec3 lightDir = normalize(uLightPos - vFragPos);
                vec3 viewDir = normalize(uViewPos - vFragPos);
                vec3 halfDir = normalize(lightDir + viewDir);

                float diff = max(dot(normal, lightDir), 0.0);
                float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);

                vec3 diffuse = albedo * diff;
                vec3 specular = vec3(1.0) * spec * 0.5;

                gl_FragColor = vec4(diffuse + specular, 1.0);
            }
        `;
    }

    getVertexShaderSystem() {
		return `
			attribute vec3 aPosition;
			attribute float aColorIndex;
			
			uniform mat4 model;
			uniform mat4 cameraMatrix;
			uniform vec3 colorStack[16];
			uniform int colorStackLength;
			
			varying vec3 fragColor;
			
			void main() {
				int i = int(aColorIndex);
				fragColor = colorStack[i];
				gl_Position = cameraMatrix * model * vec4(aPosition, 1.0);
			}
		`;
	}
	
	getFragmentShaderSystem() {
		return `
			precision mediump float;
			varying vec3 fragColor;			
			
			void main() {
				gl_FragColor = vec4(fragColor, 1.0);
			}
		`;
	}

    getAttributesBackground() {
        return ['aPosition', 'aUV', 'aNormal', 'aTangent'];
    }

    getUniformsBackground() {
        return ['model', 'cameraMatrix', 'uDiffuseMap', 'uNormalMap', 'uLightPos', 'uViewPos', 'uEnableLighting'];
    }

    getAttributesSystem() {
        return ['aPosition', 'aColorIndex'];
    }

    getUniformsSystem() {
        return ['model', 'cameraMatrix', 'colorStack', 'colorStackLength'];
    }

}
