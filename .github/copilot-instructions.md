# Agent Coding Rules for Local Qwen 3.5 9B (Cline)

1. Always read `design.md` before creating any file.
2. Write complete, clean, self-contained files without placeholders.
3. NEVER change the 10 feature names or their exact order defined in `design.md`.
4. Keep every Python and JSX file modular and under 160 lines.
5. Use Python 3.10+ with type hints and docstrings. Never use deprecated FastAPI `@app.on_event` (use `lifespan`).
6. Enable CORS in FastAPI for `http://localhost:5173`.
7. Write complete, runnable code—never leave `# TODO` or placeholder comments.
8. After creating a Python script, verify it runs cleanly in the terminal before finishing the task.
9. NEVER read CSV, JSON, or log data files inside backend/data/ with read_file. Use pandas in Python scripts instead.
