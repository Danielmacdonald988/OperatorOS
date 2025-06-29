import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export interface TestResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

export async function testAgentCode(code: string, agentName: string): Promise<TestResult> {
  const startTime = Date.now();
  const tempFile = join(tmpdir(), `${agentName}_test.py`);
  
  try {
    // Write code to temporary file
    writeFileSync(tempFile, code);
    
    // Run basic syntax check
    const syntaxCheck = await runPythonCommand(['python3', '-m', 'py_compile', tempFile]);
    
    if (!syntaxCheck.success) {
      return {
        success: false,
        output: syntaxCheck.output,
        error: 'Syntax Error: ' + syntaxCheck.error,
        executionTime: Date.now() - startTime,
      };
    }

    // Run basic execution test (dry run)
    const testCode = `
import sys
sys.path.append('${tmpdir()}')
try:
    import ${agentName}_test
    print("Import successful")
    # Try to call main function if it exists
    if hasattr(${agentName}_test, 'main'):
        print("Main function found")
        # Don't actually run main to avoid side effects
    print("Basic validation passed")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
`;

    const testFile = join(tmpdir(), `test_${agentName}.py`);
    writeFileSync(testFile, testCode);
    
    const executionTest = await runPythonCommand(['python3', testFile]);
    
    // Cleanup
    try {
      unlinkSync(tempFile);
      unlinkSync(testFile);
    } catch (error) {
      // Ignore cleanup errors
    }
    
    return {
      success: executionTest.success,
      output: executionTest.output,
      error: executionTest.error,
      executionTime: Date.now() - startTime,
    };
    
  } catch (error) {
    // Cleanup on error
    try {
      unlinkSync(tempFile);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    return {
      success: false,
      output: '',
      error: `Test setup error: ${error.message}`,
      executionTime: Date.now() - startTime,
    };
  }
}

function runPythonCommand(command: string[]): Promise<{
  success: boolean;
  output: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    const process = spawn(command[0], command.slice(1));
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr || undefined,
      });
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      process.kill();
      resolve({
        success: false,
        output: stdout,
        error: 'Test timeout after 30 seconds',
      });
    }, 30000);
  });
}
