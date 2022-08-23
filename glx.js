export default function glx(...args) {
  const gl = createContext(...args)

  return {
    context: gl,
    createFramebuffer: createFramebuffer(gl),
    createIbo: createIbo(gl),
    createProgram: createProgram(gl),
    createVbo: createVbo(gl),
    getUniformLocations: getUniformLocations(gl),
  }
}

export function shaderCompiler(gl) {
  return (type) => {
    return (source) => {
      const shader = gl.createShader(type)

      gl.shaderSource(shader, source)
      gl.compileShader(shader)

      const compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

      if (!compileStatus) {
        throw new Error(`glx.shaderCompiler: failed: ${gl.getShaderInfoLog(shader)}`)
      }

      return shader
    }
  }
}

export function createProgram(gl) {
  const createShader = shaderCompiler(gl)

  const loadVShader = createShader(gl.VERTEX_SHADER)
  const loadFShader = createShader(gl.FRAGMENT_SHADER)

  return (vs, fs) => {
    const program = gl.createProgram()
    const v = loadVShader(vs)
    const f = loadFShader(fs)

    gl.attachShader(program, v)
    gl.attachShader(program, f)

    gl.linkProgram(program)

    const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS)

    if (!linkStatus) {
      throw new Error(`glx.createProgram: failed: ${gl.getProgramInfoLog(program)}`)
    }

    // NB: Is this needed / recommended?
    gl.deleteShader(f)
    gl.deleteShader(v)

    gl.validateProgram(program)

    const validateStatus = gl.getProgramParameter(program, gl.VALIDATE_STATUS)

    if (!validateStatus) {
      throw new Error(`glx.createProgram: failed: ${gl.getProgramInfoLog(program)}`)
    }

    return program
  }
}

// Helps set up vertex buffer objects.
export function createVbo(gl) {
  return (array, usage = gl.STATIC_DRAW) => {
    const vbo = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, array, usage)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    return vbo
  }
}

// Helps set up index buffer objects.
export function createIbo(gl) {
  return (array, usage = gl.STATIC_DRAW) => {
    const ibo = gl.createBuffer()

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, usage)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    return ibo
  }
}

export function createFramebuffer(gl) {
  return () => {
    const framebuffer = gl.createFramebuffer()

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

    return framebuffer
  }
}

export function getUniformLocations(gl) {
  return (program, keys) => {
    const locations = {}

    for (const k of keys) {
      locations[k] = gl.getUniformLocation(program, k)
    }

    return locations
  }
}

export function createContext(canvas, options) {
  const { types, attributes } = {
    // These are for WebGL v1 / OpenGL ES 2.0 and 'webgl2' would be for WebGL v2 / OpenGL ES 3.0
    types: ["webgl2", "webgl", "experimental-webgl"],
    // Unsane defaults?
    attributes: { antialias: true },
    // Last in wins the merge.
    ...options,
  }

  // Look up first available type.
  for (const type of types) {
    try {
      // Would be `null` if no match found.
      const context = canvas?.getContext(type, attributes)

      if (!context) {
        throw new Error("glx: failed to create WebGL context")
      }

      return context
    } catch (e) {
      throw e
    }
  }
}
