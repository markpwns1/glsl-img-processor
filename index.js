
const vsSource = `
attribute vec4 v_pos;
attribute vec2 v_texcoord;

varying highp vec2 texcoord;

void main() {
    gl_Position = v_pos;
    texcoord = v_texcoord;
}
`;

let mainTex;
/** @type {WebGLRenderingContext} */
let gl;
let squareBuffer;
let programInfo;

//
// Initialize a shader program, so WebGL knows how to draw our data
//
/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {string} vsSource 
 * @param {string} fsSource 
 */
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  
    // Create the shader program
  
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    // If creating the shader program failed, alert
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
  
    return shaderProgram;
}
  
//
// creates a shader of the given type, uploads the source and
// compiles it.
//
/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {number} type
 * @param {string} source
 */
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
  
    // Send the source to the shader object

    gl.shaderSource(shader, source);
  
    // Compile the shader program
  
    gl.compileShader(shader);
  
    // See if it compiled successfully
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
  
    return shader;
}

/**
 * 
 * @param {WebGLRenderingContext} gl 
 */
function initBuffers(gl) {

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
    const positions = [
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ];
  
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW);
  
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

    const texCoords = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, 
        new Float32Array(texCoords),
        gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        textureCoord: texCoordBuffer
    };
}

function drawScene(gl, programInfo, buffers) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  
    // Clear the canvas before we start drawing on it.
  
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    // tell webgl how to pull out the texture coordinates from buffer
    {
        const num = 2; // every coordinate composed of 2 values
        const type = gl.FLOAT; // the data in the buffer is 32 bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
    }

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 2;  // pull out 2 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
                                    // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }
  
    // Tell WebGL to use our program when drawing
  
    gl.useProgram(programInfo.program);
    // console.log(programInfo.code);
  
    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, mainTex);

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.maintex, 0);

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}
  

function main() {
    const canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
  
    reloadShader();

    squareBuffer = initBuffers(gl);

    updateDimensions();
}

function reloadShader() {
    const shaderProgram = initShaderProgram(gl, vsSource, $("#frag-shader-code").val());
    programInfo = {
        program: shaderProgram,
        // code: $("#frag-shader-code").text(),
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'v_pos'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'v_texcoord'),
        },
        uniformLocations: {
            maintex: gl.getUniformLocation(shaderProgram, 'maintex'),
        }
    };
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url, onLoaded) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        srcFormat, srcType, image);
    
        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        }

        onLoaded();
    };
    image.src = url;
  
    return texture;
}
  
function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function updateDimensions() {
    const dimensions = $("#img-dimensions").val().split(",").map(x => x.trim());
    const canvas = $("#glCanvas")[0];
    canvas.width = dimensions[0];
    canvas.height = dimensions[1];
    canvas.style.width  = dimensions[0] + 'px';
    canvas.style.height = dimensions[1] + 'px';
}

let texNo = 0;

window.onload = () => {
    main();

    $("#file-upload").on("change", function() {
        if (this.files && this.files[0]) {
            const src = URL.createObjectURL(this.files[0]); // set src to blob url
            const $container = $("<div class='texture'></div>");

            mainTex = loadTexture(gl, src, () => {
                reloadShader();
                drawScene(gl, programInfo, squareBuffer);
            });

            const $img = $("<img class='thumbnail'></img>");
            $img.attr("src", src);
            $container.append($img);

            const $settings = $("<div class='texture-settings'></div>");
            $settings.append("<br>");

            const $size = $("<p>WxH</p>");
            $settings.append($size);

            const $filename = $("<input type='text'>");
            $filename.val("tex" + (texNo++));
            $settings.append($filename);

            const $delete = $("<button>X</button>");
            $settings.append($delete);

            $container.append($settings);
            
            $("#texture-list").append($container);
        }
        // console.log("AAAAAA");
    });

    $("#reload-btn").click(() => {
        reloadShader();
        drawScene(gl, programInfo, squareBuffer);
        console.log($("#frag-shader-code").val());
    });

    $("#update-img-properties").click(() => {
        updateDimensions();
        drawScene(gl, programInfo, squareBuffer);
    });
};


