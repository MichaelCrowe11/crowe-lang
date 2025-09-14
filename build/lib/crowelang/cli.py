"""
CroweLang CLI - Python Command Line Interface
Copyright (c) 2024 Michael Benjamin Crowe
"""

import click
import os
import sys
from pathlib import Path
from .compiler import compile_strategy
from . import __version__

@click.group()
@click.version_option(__version__)
def main():
    """CroweLang - Professional Quantitative Trading DSL"""
    pass

@main.command()
@click.argument('input_file', type=click.Path(exists=True))
@click.option('--target', '-t', default='python', 
              help='Target language (python, typescript, cpp, rust)')
@click.option('--output', '-o', help='Output file path')
@click.option('--optimize', is_flag=True, help='Enable optimizations')
@click.option('--debug', is_flag=True, help='Include debug information')
def compile(input_file, target, output, optimize, debug):
    """Compile CroweLang strategy to target language"""
    
    # Read input file
    try:
        with open(input_file, 'r') as f:
            strategy_code = f.read()
    except Exception as e:
        click.echo(f"Error reading {input_file}: {e}", err=True)
        sys.exit(1)
    
    # Compile strategy
    options = {
        'optimize': optimize,
        'debug': debug
    }
    
    result = compile_strategy(strategy_code, target, **options)
    
    if not result.success:
        click.echo(f"Compilation failed: {result.error_message}", err=True)
        sys.exit(1)
    
    # Get compiled code
    if target == 'python':
        compiled_code = result.python_code
        default_ext = '.py'
    elif target == 'typescript':
        compiled_code = result.typescript_code
        default_ext = '.ts'
    elif target == 'cpp':
        compiled_code = result.python_code  # TODO: Add C++ support
        default_ext = '.cpp'
    elif target == 'rust':
        compiled_code = result.python_code  # TODO: Add Rust support
        default_ext = '.rs'
    else:
        click.echo(f"Unsupported target: {target}", err=True)
        sys.exit(1)
    
    # Determine output file
    if not output:
        input_path = Path(input_file)
        output = input_path.with_suffix(default_ext)
    
    # Write output
    try:
        with open(output, 'w') as f:
            f.write(compiled_code)
        
        click.echo(f"Compiled {input_file} -> {output}")
        
        if result.warnings:
            click.echo("Warnings:")
            for warning in result.warnings:
                click.echo(f"  - {warning}")
                
    except Exception as e:
        click.echo(f"Error writing {output}: {e}", err=True)
        sys.exit(1)

@main.command()
@click.argument('strategy_file', type=click.Path(exists=True))
@click.option('--start-date', help='Backtest start date (YYYY-MM-DD)')
@click.option('--end-date', help='Backtest end date (YYYY-MM-DD)')
@click.option('--symbol', default='SPY', help='Trading symbol')
@click.option('--capital', default=100000, type=float, help='Initial capital')
def backtest(strategy_file, start_date, end_date, symbol, capital):
    """Run backtest on CroweLang strategy (requires license)"""
    
    # Check for license
    if not os.environ.get("CROWELANG_LICENSE_KEY"):
        click.echo("Backtesting requires a CroweLang license.", err=True)
        click.echo("Visit https://crowelang.com/pricing to purchase.")
        sys.exit(1)
    
    click.echo("Backtest functionality requires full license.")
    click.echo("This feature will be available in the complete version.")

@main.command()
def license():
    """Manage CroweLang license"""
    
    key = os.environ.get("CROWELANG_LICENSE_KEY")
    
    if key:
        click.echo(f"License key: {key[:8]}...{key[-4:]}")
        click.echo("Status: Active")
    else:
        click.echo("No license key found.")
        click.echo("Set CROWELANG_LICENSE_KEY environment variable.")
        click.echo("Visit https://crowelang.com/pricing to purchase.")

@main.command()
def info():
    """Show CroweLang information"""
    
    click.echo(f"CroweLang v{__version__}")
    click.echo("Professional Quantitative Trading DSL")
    click.echo("Copyright (c) 2024 Michael Benjamin Crowe")
    click.echo("")
    click.echo("Website: https://crowelang.com")
    click.echo("Documentation: https://crowelang.com/docs")
    click.echo("Support: https://crowelang.com/support")

if __name__ == '__main__':
    main()