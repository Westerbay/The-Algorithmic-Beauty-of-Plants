import com.jogamp.opengl.*;
import com.jogamp.opengl.awt.GLCanvas;

import javax.swing.*;
import java.nio.FloatBuffer;

public class Main implements GLEventListener {

    private int programId;
    private int vaoId;
    private int vboId;

    private final float[] vertices = {
            // positions       // colors
            -0.5f, -0.5f, 0f,   1f, 0f, 0f, // rouge
            0.5f, -0.5f, 0f,   0f, 1f, 0f, // vert
            0.0f,  0.5f, 0f,   0f, 0f, 1f  // bleu
    };

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("Triangle OpenGL - JOGL");
            GLProfile profile = GLProfile.get(GLProfile.GL4);
            GLCapabilities capabilities = new GLCapabilities(profile);
            GLCanvas canvas = new GLCanvas(capabilities);
            canvas.addGLEventListener(new Main());

            frame.getContentPane().add(canvas);
            frame.setSize(800, 600);
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setVisible(true);
            canvas.requestFocusInWindow();
        });
    }

    @Override
    public void init(GLAutoDrawable drawable) {
        GL4 gl = drawable.getGL().getGL4();

        String vertexShaderSrc = """
            #version 330 core
            layout(location = 0) in vec3 aPos;
            layout(location = 1) in vec3 aColor;
            out vec3 vColor;
            void main() {
                gl_Position = vec4(aPos, 1.0);
                vColor = aColor;
            }
        """;

        String fragmentShaderSrc = """
            #version 330 core
            in vec3 vColor;
            out vec4 FragColor;
            void main() {
                FragColor = vec4(vColor, 1.0);
            }
        """;

        int vert = compileShader(gl, GL4.GL_VERTEX_SHADER, vertexShaderSrc);
        int frag = compileShader(gl, GL4.GL_FRAGMENT_SHADER, fragmentShaderSrc);

        programId = gl.glCreateProgram();
        gl.glAttachShader(programId, vert);
        gl.glAttachShader(programId, frag);
        gl.glLinkProgram(programId);
        gl.glUseProgram(programId);

        int[] vaos = new int[1];
        gl.glGenVertexArrays(1, vaos, 0);
        vaoId = vaos[0];
        gl.glBindVertexArray(vaoId);

        int[] vbos = new int[1];
        gl.glGenBuffers(1, vbos, 0);
        vboId = vbos[0];

        gl.glBindBuffer(GL.GL_ARRAY_BUFFER, vboId);
        gl.glBufferData(GL.GL_ARRAY_BUFFER, vertices.length * 4, FloatBuffer.wrap(vertices), GL.GL_STATIC_DRAW);

        gl.glVertexAttribPointer(0, 3, GL.GL_FLOAT, false, 6 * 4, 0);
        gl.glEnableVertexAttribArray(0);

        gl.glVertexAttribPointer(1, 3, GL.GL_FLOAT, false, 6 * 4, 3 * 4);
        gl.glEnableVertexAttribArray(1);
    }

    @Override
    public void display(GLAutoDrawable drawable) {
        GL4 gl = drawable.getGL().getGL4();
        gl.glClear(GL.GL_COLOR_BUFFER_BIT);
        gl.glUseProgram(programId);
        gl.glBindVertexArray(vaoId);
        gl.glDrawArrays(GL.GL_TRIANGLES, 0, 3);
    }

    @Override public void dispose(GLAutoDrawable drawable) {}
    @Override public void reshape(GLAutoDrawable drawable, int x, int y, int width, int height) {}

    private int compileShader(GL4 gl, int type, String source) {
        int shader = gl.glCreateShader(type);
        String[] lines = new String[]{source};
        int[] lengths = new int[]{source.length()};
        gl.glShaderSource(shader, 1, lines, lengths, 0);
        gl.glCompileShader(shader);

        int[] compiled = new int[1];
        gl.glGetShaderiv(shader, GL2ES2.GL_COMPILE_STATUS, compiled, 0);
        if (compiled[0] == 0) {
            byte[] log = new byte[1024];
            gl.glGetShaderInfoLog(shader, 1024, null, 0, log, 0);
            System.err.println("Shader compile error:\n" + new String(log));
            System.exit(1);
        }
        return shader;
    }
}
