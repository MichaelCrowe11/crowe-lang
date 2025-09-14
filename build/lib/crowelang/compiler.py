"""
CroweLang Compiler - Python API
Copyright (c) 2024 Michael Benjamin Crowe
"""

import subprocess
import json
import tempfile
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

@dataclass
class CompilationResult:
    """Result from strategy compilation"""
    success: bool
    python_code: str = ""
    typescript_code: str = ""
    error_message: str = ""
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []

class Compiler:
    """CroweLang strategy compiler"""
    
    def __init__(self, node_path: str = "node"):
        self.node_path = node_path
        self.compiler_path = self._find_compiler()
    
    def _find_compiler(self) -> str:
        """Find the TypeScript compiler executable"""
        # Look for compiled JS version first
        possible_paths = [
            "dist/index.js",
            "packages/crowe-compiler/dist/index.js", 
            "node_modules/.bin/crowe-compile"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        raise RuntimeError("CroweLang compiler not found. Install with: npm install -g crowelang")
    
    def compile(
        self,
        strategy_code: str,
        target: str = "python",
        options: Optional[Dict[str, Any]] = None
    ) -> CompilationResult:
        """
        Compile CroweLang strategy to target language
        
        Args:
            strategy_code: CroweLang strategy source code
            target: Target language ("python", "typescript", "cpp", "rust")
            options: Compilation options
            
        Returns:
            CompilationResult with generated code
        """
        
        options = options or {}
        
        # Create temporary file for strategy
        with tempfile.NamedTemporaryFile(mode='w', suffix='.crowe', delete=False) as f:
            f.write(strategy_code)
            strategy_file = f.name
        
        try:
            # Build command
            cmd = [
                self.node_path,
                self.compiler_path,
                "compile",
                strategy_file,
                "--target", target,
                "--output", "json"  # Get JSON output for parsing
            ]
            
            # Add options
            if options.get("optimize"):
                cmd.append("--optimize")
            if options.get("debug"):
                cmd.append("--debug")
                
            # Run compiler
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Parse JSON output
                try:
                    output = json.loads(result.stdout)
                    return CompilationResult(
                        success=True,
                        python_code=output.get("python", ""),
                        typescript_code=output.get("typescript", ""),
                        warnings=output.get("warnings", [])
                    )
                except json.JSONDecodeError:
                    # Fallback - treat as direct code output
                    if target == "python":
                        return CompilationResult(
                            success=True,
                            python_code=result.stdout
                        )
                    else:
                        return CompilationResult(
                            success=True,
                            typescript_code=result.stdout
                        )
            else:
                return CompilationResult(
                    success=False,
                    error_message=result.stderr or result.stdout
                )
                
        except subprocess.TimeoutExpired:
            return CompilationResult(
                success=False,
                error_message="Compilation timed out"
            )
        except Exception as e:
            return CompilationResult(
                success=False,
                error_message=f"Compilation failed: {str(e)}"
            )
        finally:
            # Cleanup temp file
            try:
                os.unlink(strategy_file)
            except:
                pass

def compile_strategy(
    strategy_code: str,
    target: str = "python",
    **options
) -> CompilationResult:
    """
    Convenience function to compile CroweLang strategy
    
    Args:
        strategy_code: CroweLang strategy source
        target: Target language
        **options: Compilation options
        
    Returns:
        CompilationResult
    """
    compiler = Compiler()
    return compiler.compile(strategy_code, target, options)