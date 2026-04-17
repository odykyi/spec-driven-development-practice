# File Upload System

Specify requirements for a file upload system with validation, storage, and progress tracking.

## Instructions

Write a specification for handling file uploads including validation, storage, and user feedback.

## Learning Goals

- Specify file constraints (size, type, etc.)
- Define upload progress tracking
- Handle upload errors and resumable uploads
- Document virus scanning and security

## Requirements

Your specification should cover:
1. Supported file types (MIME type validation)
2. File size limits
3. Upload progress indication
4. Chunked uploads for large files
5. Virus/malware scanning
6. Storage and retrieval
7. Duplicate file detection

## Constraints

- Max file size: 100MB
- Allowed types: images (jpg, png, gif), documents (pdf, doc, docx)
- Virus scan required before storage
- Uploads resumable within 24 hours
- Storage quota per user: 1GB

## Example Structure

```markdown
### Requirement: File Upload Validation
The system SHALL validate uploaded files before processing.

#### Scenario: Valid file upload
- **GIVEN** a user selects a 5MB PDF file
- **WHEN** the user initiates upload
- **THEN** the system validates file type and size
- **AND** begins chunked upload
- **AND** displays progress percentage

#### Scenario: File too large
- **GIVEN** a user selects a 150MB video file
- **WHEN** the user initiates upload
- **THEN** the system returns error: "File exceeds 100MB limit"
- **AND** prevents upload from starting
```

## Definition of Done

✅ **Initialize OpenSpec change**: `sdd init-exercise patterns/file-upload`  
✅ **Write in `openspec/changes/patterns-file-upload/specs/spec.md`**  
✅ **At least 8 scenarios** covering validation, progress, errors  
✅ **File type validation** (MIME types)  
✅ **Size limits enforced** (100MB max)  
✅ **Progress tracking** for uploads  
✅ **Virus scanning** before storage  
✅ **Storage quota** per user (1GB)  
✅ **All artifacts complete**: Check with `openspec status --change patterns-file-upload`  
✅ **Validates successfully**: Run `openspec validate --change patterns-file-upload`

## Where to Write

After running `sdd init-exercise patterns/file-upload`, edit:
```
~/sdd-exercises/openspec/changes/patterns-file-upload/specs/spec.md
```

Run this to open it:
```bash
cd ~/sdd-exercises/openspec/changes/patterns-file-upload
open specs/spec.md        # On macOS
# Or: nano specs/spec.md
# Or: code specs/spec.md  # VS Code
```
