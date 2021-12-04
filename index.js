
const vsSource = `
attribute vec4 v_pos;
attribute vec2 v_texcoord;

varying highp vec2 texcoord;

void main() {
    gl_Position = v_pos;
    texcoord = v_texcoord;
}
`;

// let mainTex;
/** @type {WebGLRenderingContext} */
let gl;
let squareBuffer;
let programInfo;
let $messages;

let textures = { };

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
        sendMessage('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
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
        sendMessage('An error occurred compiling the shaders: \n' + gl.getShaderInfoLog(shader).trim());
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

/**
 * 
 * @param {WebGLRenderingContext} gl 
 */
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
  
    const keys = Object.keys(textures);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        
        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0 + i);

        // Bind the texture to texture unit 0
        if(textures[key])
            gl.bindTexture(gl.TEXTURE_2D, textures[key].texture);
        else 
            gl.bindTexture(gl.TEXTURE_2D, null);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(gl.getUniformLocation(programInfo.program, key), i);
    }
    
    const canvas = $("#glCanvas")[0];
    gl.uniform2f(gl.getUniformLocation(programInfo.program, "output_size"), canvas.width, canvas.height);

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }

}
  
function main() {

    colourPicker();

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

    updateDimensions($("#output-dimensions").val(), true);
    updateDimensions($("#view-dimensions").val(), false);
    drawScene(gl, programInfo, squareBuffer);
}

// gl.getUniformLocation(shaderProgram, 'maintex')
function reloadShader() {
    const shaderProgram = initShaderProgram(gl, vsSource, editor.getValue());
    programInfo = {
        program: shaderProgram,
        // code: $("#frag-shader-code").text(),
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'v_pos'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'v_texcoord'),
        }
    };
    return shaderProgram;
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url, onLoaded, onFailed) {
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

        onLoaded(texture, image);
    };

    image.onerror = onFailed;

    image.src = url;
  
    return texture;
}
  
function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function colourPicker() {
    const colorBlock = document.getElementById('color-block');
    const ctx1 = colorBlock.getContext('2d');
    const width1 = colorBlock.width;
    const height1 = colorBlock.height;

    const colorStrip = document.getElementById('color-strip');
    const ctx2 = colorStrip.getContext('2d');
    const width2 = colorStrip.width;
    const height2 = colorStrip.height;

    const colorLabel = document.getElementById('color-label');
    const colorText = document.getElementById('color-text');

    let x = width1;
    let y = height1;
    let drag = false;
    let dragStrip = false;
    let rgbaColor = 'rgba(255,0,0,1)';

    ctx1.rect(0, 0, width1, height1);
    fillGradient();

    ctx2.rect(0, 0, width2, height2);
    var grd1 = ctx2.createLinearGradient(0, 0, 0, height1);
    grd1.addColorStop(0, 'rgba(255, 0, 0, 1)');
    grd1.addColorStop(0.17, 'rgba(255, 255, 0, 1)');
    grd1.addColorStop(0.34, 'rgba(0, 255, 0, 1)');
    grd1.addColorStop(0.51, 'rgba(0, 255, 255, 1)');
    grd1.addColorStop(0.68, 'rgba(0, 0, 255, 1)');
    grd1.addColorStop(0.85, 'rgba(255, 0, 255, 1)');
    grd1.addColorStop(1, 'rgba(255, 0, 0, 1)');
    ctx2.fillStyle = grd1;
    ctx2.fill();

    function fillGradient() {
        ctx1.fillStyle = rgbaColor;
        ctx1.fillRect(0, 0, width1, height1);

        var grdWhite = ctx2.createLinearGradient(0, 0, width1, 0);
        grdWhite.addColorStop(0, 'rgba(255,255,255,1)');
        grdWhite.addColorStop(1, 'rgba(255,255,255,0)');
        ctx1.fillStyle = grdWhite;
        ctx1.fillRect(0, 0, width1, height1);

        var grdBlack = ctx2.createLinearGradient(0, 0, 0, height1);
        grdBlack.addColorStop(0, 'rgba(0,0,0,0)');
        grdBlack.addColorStop(1, 'rgba(0,0,0,1)');
        ctx1.fillStyle = grdBlack;
        ctx1.fillRect(0, 0, width1, height1);
    }

    function changeColor(e) {
        if(e) {
            x = e.offsetX;
            y = e.offsetY;
        }
        var imageData = ctx1.getImageData(x, y, 1, 1).data;
        rgbaColor = 'rgba(' + imageData[0] + ',' + imageData[1] + ',' + imageData[2] + ',1)';
        colorLabel.style.backgroundColor = rgbaColor;
        let r = Math.round(imageData[0] / 255.0 * 1000.0) / 1000.0;
        let g = Math.round(imageData[1] / 255.0 * 1000.0) / 1000.0;
        let b = Math.round(imageData[2] / 255.0 * 1000.0) / 1000.0;
        colorText.value = "vec3(" + r + ', ' + g + ', ' + b + ")\nvec4(" + r + ', ' + g + ', ' + b + ", 1.0)";
    }

    function clickStrip(e) {
        let x = e.offsetX;
        let y = e.offsetY;
        var imageData = ctx2.getImageData(x, y, 1, 1).data;
        rgbaColor = 'rgba(' + imageData[0] + ',' + imageData[1] + ',' + imageData[2] + ',1)';
        fillGradient();
        changeColor();
    }

    colorStrip.addEventListener("mousedown", e => { 
        dragStrip = true;
        clickStrip(e);
    }, false);

    colorStrip.addEventListener("mouseup", () => { 
        dragStrip = false 
    }, false);

    colorStrip.addEventListener("mousemove", e => {
        if (dragStrip) {
            clickStrip(e);
        }
    }, false);

    colorBlock.addEventListener("mousedown", e => { 
        drag = true;
        changeColor(e);
    }, false);

    colorBlock.addEventListener("mouseup", () => { 
        drag = false 
    }, false);

    colorBlock.addEventListener("mousemove", e => {
        if (drag) {
            changeColor(e);
        }
    }, false);

    changeColor();
}

function isNumber(t) {
    return !isNaN(t);
}

function setOutputDimensions(width, height) {
    const canvas = $("#glCanvas")[0];
    canvas.width = width;
    canvas.height = height;
}

function setViewDimensions(width, height) {
    const canvas = $("#glCanvas")[0];
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
}

function updateDimensions(text, real) {
    const dimensions = text.split(",").map(x => x.trim());
    const canvas = $("#glCanvas")[0];

    function isValid() {
        return dimensions.length == 2 && dimensions.every(x => isNumber(x));
    }

    if(real) {
        if(isValid()) {
            canvas.width = dimensions[0];
            canvas.height = dimensions[1];
            sendMessage("Set output dimensions to " + canvas.width + "," + canvas.height);
        }
        else {
            $("#output-dimensions").val(canvas.width + "," + canvas.height);
        }
    }
    else {
        if(isValid()) {
            canvas.style.width = dimensions[0] + 'px';
            canvas.style.height = dimensions[1] + 'px';
            sendMessage("Set viewing dimensions to " + dimensions[0] + "," + dimensions[1]);
        }
        else {
            $("#view-dimensions").val(
                canvas.style.width.substring(0, canvas.style.width.length - 2) + "," + 
                canvas.style.height.substring(0, canvas.style.height.length - 2));
        }
    }
}

let texNo = 0;

function addTexture(src, srcFilename, name) {
    const $container = $("<div class='texture'></div>");

    let texture;
    let filename = name || ("tex" + (texNo++));
    let img;
    
    const $img = $("<img class='thumbnail'></img>");
    $img.attr("src", src);
    $container.append($img);

    const $settings = $("<div class='texture-settings'></div>");

    const $props = $("<p class='texture-props'></p>");
    $props.text(srcFilename);
    $settings.append($props);

    function deleteTexture() {
        textures[filename] = null;
        $container.remove();
        sendMessage("Deleted texture " + filename);
        drawScene(gl, programInfo, squareBuffer);
    }

    function texInfo() {
        return {
            filename: filename,
            srcFilename: srcFilename,
            texture: texture,
            image: img,
            destroy: deleteTexture
        }
    }

    function updateFilename() {
        let proposedFilename = $filename.val();
        if(/[_a-zA-Z][_a-zA-Z0-9]*/.test(proposedFilename)) {
            textures[filename] = null;
            let old = filename;
            filename = proposedFilename;
            textures[filename] = texInfo();
            sendMessage("Renamed texture " + old + " to " + filename);
            drawScene(gl, programInfo, squareBuffer);
        }
        else {
            $filename.val(filename);
        }
    }

    const $filename = $("<input type='text'>");
    $filename.val(filename);
    $filename.on("keypress", e => {
        if(e.which == 13) {
            updateFilename();
        }
    });
    
    $filename.focusout(() => {
        updateFilename();
    });

    $settings.append($filename);

    const $delete = $("<button>X</button>");
    $delete.click(deleteTexture);

    $settings.append($delete);

    loadTexture(gl, src, (t, i) => {
        texture = t;
        img = i;
        textures[filename] = texInfo();
        $props.html(srcFilename + "<br>size: " + img.width + "," + img.height);
        // reloadShader();
        
        $container.append($settings);
        
        $("#texture-list").append($container);

        sendMessage("Uploaded texture " + srcFilename + " as " + filename);
        drawScene(gl, programInfo, squareBuffer);
    }, () => {
        sendMessage("Failed to upload image " + srcFilename);
        alert("Could not load image.");
    });
}

function getFilename(path) {
    path = path.replace(/\\/gi, "/");
    return path.substring(path.lastIndexOf("/") + 1);
}

function sendMessage(text) {
    console.log(text);
    $messages.append(text + "\n");
    $messages.scrollTop($messages[0].scrollHeight);
}

function imageToBlob(img, onComplete) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(onComplete);
}

window.onload = () => {

    $("#file-upload").on("change", function() {
        if (this.files && this.files[0]) {
            const src = URL.createObjectURL(this.files[0]);
            addTexture(src, getFilename(this.value));
        }
    });

    $("#file-src-box").on("keypress", function(e) {
        if(e.which == 13) {
            addTexture(this.value, getFilename(this.value));
        }
    })

    $("#reload-btn").click(() => {
        reloadShader();
        drawScene(gl, programInfo, squareBuffer);
        sendMessage("Regenerated output texture");
        // console.log($("#frag-shader-code").val());
    });

    $("#output-dimensions").on("keypress", function(e) {
        if(e.which == 13) {
            updateDimensions(this.value, true);
            drawScene(gl, programInfo, squareBuffer);
        }
    });

    $("#output-dimensions").focusout(function() {
        updateDimensions(this.value, true);
        drawScene(gl, programInfo, squareBuffer);
    });

    $("#view-dimensions").on("keypress", function(e) {
        if(e.which == 13) {
            updateDimensions(this.value, false);
            drawScene(gl, programInfo, squareBuffer);
        }
    });

    $("#view-dimensions").focusout(function() {
        updateDimensions(this.value, false);
        drawScene(gl, programInfo, squareBuffer);
    });

    $messages = $("#msg-textarea");

    $("#save-btn").click(() => {
        const zip = new JSZip();
        zip.file("frag.glsl", editor.getValue());
        const textureFolder = zip.folder("textures");

        const canvas = $("#glCanvas")[0];

        const project = { 
            outputWidth: canvas.width,
            outputHeight: canvas.height,
            viewWidth: parseInt(canvas.style.width.substring(0, canvas.style.width.length - 2)),
            viewHeight: parseInt(canvas.style.height.substring(0, canvas.style.height.length - 2)),
            textures: { }
        };

        const keys = Object.keys(textures);
        let toExport = keys.length;
        // console.log(toExport);

        function save() {
            zip.file("project.json", JSON.stringify(project, null, 2));
            zip.generateAsync({type:"blob"})
            .then(blob => {
                saveAs(blob, "project.zip");
            });
        }

        for (const key of keys) {
            const tex = textures[key];

            if (!tex) {
                toExport--;
                continue;
            };

            project.textures[tex.filename] = tex.srcFilename;
            imageToBlob(tex.image, blob => {
                textureFolder.file(tex.srcFilename, blob);
                toExport--;
                // console.log(toExport);
                if(toExport < 1) {
                    save();
                }
            });
        }
    });

    $("#load-btn").click(() => {
        var input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => { 
            JSZip.loadAsync(e.target.files[0]).then(zip => {
                sendMessage("Loading project...");

                if(zip.file("frag.glsl")) {
                    zip.file("frag.glsl").async("text").then(txt => {
                        editor.setValue(txt);
                        sendMessage("Loaded shader file");
                    }); 
                } else sendMessage("Missing frag.glsl");

                if(zip.file("project.json")) {
                    zip.file("project.json").async("text").then(txt => {
                        const project = JSON.parse(txt);
                        setOutputDimensions(project.outputWidth, project.outputHeight);
                        setViewDimensions(project.viewWidth, project.viewHeight);
                        updateDimensions("", true);
                        updateDimensions("", false);

                        for (const key in textures) {
                            textures[key].destroy();
                        }
                        textures = { };

                        const keys = Object.keys(project.textures);
                        let remaining = keys.length;
                        // console.log(remaining);
                        for (const tex of keys) {
                            const path = project.textures[tex];

                            if(!path) {
                                remaining--;
                                continue;
                            }

                            if(!zip.file("textures/" + path)) {
                                remaining--;
                                sendMessage("Could not find textures/" + path);
                                if(remaining < 1) {
                                    sendMessage("Finished loading project");
                                }
                                continue;
                            }

                            zip.file("textures/" + path).async("blob").then(blob => {
                                const src = URL.createObjectURL(blob);
                                addTexture(src, path, tex);
                                remaining--;
                                console.log(remaining);
                                if(remaining < 1) {
                                    reloadShader();
                                    drawScene(gl, programInfo, squareBuffer);
                                    sendMessage("Finished loading project");
                                }
                            });
                        }
                    });
                } else sendMessage("Missing project.json\nFinished loaded project");
            }).catch(() => {
                alert("Could not load file.");
            });
        }
        input.click();
    });

    main();

};


