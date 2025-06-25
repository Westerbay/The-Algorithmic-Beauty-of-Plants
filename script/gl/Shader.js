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
                fragPos.y -= 0.001; //Does not overlapp shadow
                vFragPos = fragPos;
                vUV = aUV;
                gl_Position = cameraMatrix * vec4(fragPos, 1.0);
            }
        `;
    }


    getFragmentShaderBackground() {
        return `
            precision highp float;

            varying vec2 vUV;
            varying vec3 vFragPos;
            varying mat3 vTBN;

            uniform sampler2D uDiffuseMap;
            uniform sampler2D uNormalMap;
            uniform vec3 uLightPos;
            uniform vec3 uViewPos;
            uniform bool uEnableLighting;
            uniform bool isEmpty;

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
                vec3 ambient = albedo * 0.2;
                gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
            }
        `;
    }

    getVertexShaderSystem() {
		return `
			attribute vec3 aPosition;			
            attribute vec3 aNormal;
            attribute float aColorIndex;
			
			uniform mat4 model;
			uniform mat4 cameraMatrix;
			uniform vec3 colorStack[16];
			uniform int colorStackLength;
			
			varying vec3 fragColor;
            varying vec3 vNormal;
            varying vec3 vFragPos;
			
			void main() {
                vec3 fragPos = (model * vec4(aPosition, 1.0)).xyz;
				int i = int(aColorIndex);
				fragColor = colorStack[i];
                vNormal = aNormal;
                vFragPos = fragPos;
				gl_Position = cameraMatrix * vec4(fragPos, 1.0);
			}
		`;
	}
	
	getFragmentShaderSystem() {
		return `
			precision highp float;

			varying vec3 fragColor;	
            varying vec3 vFragPos;
            varying vec3 vNormal;	

            uniform vec3 uLightPos;
            uniform vec4 shadowColor;
            uniform vec3 uViewPos;
            uniform bool uEnableLighting;
            uniform bool isShadow;

            vec3 computeColorLighting(vec3 albedo, vec3 normal) {
                vec3 lightDir = normalize(uLightPos - vFragPos);
                vec3 viewDir = normalize(uViewPos - vFragPos);
                vec3 halfDir = normalize(lightDir + viewDir);

                float diff = max(dot(normal, lightDir), 0.0);
                float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);

                vec3 diffuse = albedo * diff;
                vec3 specular = vec3(1.0) * spec * 0.5;
                vec3 ambient = albedo * 0.3;

                return ambient + diffuse + specular;
            }
			
			void main() {
                if (isShadow) {
                    gl_FragColor = shadowColor;
                    return;
                }

				vec3 albedo = fragColor;

                if (!uEnableLighting) {
                    gl_FragColor = vec4(albedo, 1.0);
                    return;
                }

                vec3 color = computeColorLighting(albedo, normalize(vNormal));
                gl_FragColor = vec4(color, 1.0);
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
        return ['aPosition', 'aColorIndex', 'aNormal', 'aTangent'];
    }

    getUniformsSystem() {
        return ['isShadow', 'shadowColor', 'model', 'cameraMatrix', 'colorStack', 'colorStackLength', 'uLightPos', 'uViewPos', 'uEnableLighting'];
    }

}
