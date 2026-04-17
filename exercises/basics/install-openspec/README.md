# Exercise 0: Install OpenSpec

Welcome! Before you start writing specifications, you need to install the OpenSpec CLI tool.

## Instructions

Install OpenSpec globally on your system so you can use it to validate your specifications.

## Learning Goals

- Install OpenSpec CLI
- Verify the installation works
- Run your first validation command

## Steps

1. Install OpenSpec globally:
   ```bash
   npm install -g @openspec/cli
   ```

2. Verify the installation:
   ```bash
   openspec --version
   ```

3. Try running help:
   ```bash
   openspec --help
   ```

## Validation

Your specification for this exercise should describe:
1. How to install OpenSpec
2. How to verify it's installed correctly
3. What commands are available

## Hints

- Use `npm install -g` for global installation
- The `--version` flag shows the installed version
- The `--help` flag shows available commands
- Think about what a new user needs to know to get started

## Definition of Done

✅ **Initialize OpenSpec change**: `sdd init-exercise basics/install-openspec`  
✅ **Write in `openspec/changes/basics-install-openspec/specs/spec.md`**  
✅ **At least 3 scenarios** (install, verify, help)  
✅ **Installation process documented** with npm command  
✅ **Verification steps included** (--version output)  
✅ **Available commands listed** (--help output)  
✅ **All artifacts complete**: Check with `openspec status --change basics-install-openspec`  
✅ **Validates successfully**: Run `openspec validate --change basics-install-openspec`

## Where to Write

After running `sdd init-exercise basics/install-openspec`, edit:
```
~/sdd-exercises/openspec/changes/basics-install-openspec/specs/spec.md
```

Run this to open it:
```bash
cd ~/sdd-exercises/openspec/changes/basics-install-openspec
open specs/spec.md        # On macOS
# Or: nano specs/spec.md
# Or: code specs/spec.md  # VS Code
```
