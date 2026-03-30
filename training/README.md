# Sakke LoRA Training

Fine-tunes a custom Finnish disc golf commentary model (Sakke) using LoRA on RTX 5080 (Blackwell/sm_120).

## Hardware & requirements

- **GPU**: RTX 5080 (16GB VRAM) — requires Unsloth 2026.3.17+ for Blackwell support
- **Python**: 3.12
- **PyTorch**: nightly cu128

## Setup (first time only)

```bash
cd training

# Create venv
python3 -m venv sakke-venv
source sakke-venv/bin/activate

# PyTorch nightly with CUDA 12.8 (required for RTX 5080)
pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu128

# Other dependencies
pip install -r requirements.txt
```

## Files

| File | Purpose |
|------|---------|
| `scenarios.py` | Defines all training scenarios (score types, positions, phases) |
| `generate_chatgpt.py` | Generates a prompt to paste into ChatGPT — outputs JSONL training data |
| `generate_eurollm.py` | Generates training data via OpenEuroLLM (Ollama API) |
| `merge_datasets.py` | Merges all files from `data/` into `training_data.jsonl` |
| `train_lora.py` | Trains LoRA adapter on the merged dataset |
| `export_gguf.py` | Exports trained adapter to GGUF for Ollama |
| `training_data.jsonl` | Merged training data (input to training) |
| `data/` | Raw data files from different generators |

## Workflow

### 1. Generate training data

**Option A — ChatGPT (best quality):**
```bash
python generate_chatgpt.py
# Opens chatgpt_prompt_<timestamp>.txt — paste into ChatGPT
# Save ChatGPT's output as data/chatgpt_<name>.json
```

**Option B — OpenEuroLLM via Ollama (automatic, Finnish model):**
```bash
OLLAMA_BASE_URL=http://<server>:11434 python generate_eurollm.py
# Saves to data/eurollm_<timestamp>.jsonl
```

### 2. Merge datasets

```bash
python merge_datasets.py
# Reads all files from data/, deduplicates, saves training_data.jsonl
```

### 3. Train

Key config in `train_lora.py`:
```python
BASE_MODEL    = "google/gemma-3-4b-it"   # multilingual, good Finnish
LORA_RANK     = 16                        # lower = less aggressive
EPOCHS        = 1                         # 1 epoch prevents catastrophic forgetting
LEARNING_RATE = 1e-4
```

```bash
source sakke-venv/bin/activate
PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True python train_lora.py
```

Output saved to `lora_sakke_gemma3/`.

### 4. Export to GGUF

```bash
python export_gguf.py
# Output: lora_sakke_gemma3_gguf/gemma-3-4b-it.Q4_K_M.gguf
```

### 5. Deploy to Ollama server

```bash
# Copy to server
scp -r lora_sakke_gemma3_gguf sakke@<server-ip>:~/

# On the server
cd lora_sakke_gemma3_gguf
ollama create sakke-gemma3 -f Modelfile

# Update .env.dev in the bot
OLLAMA_MODEL=sakke-gemma3
```

## Tuning tips

| Problem | Fix |
|---------|-----|
| Model forgot how to speak normally | Lower epochs (try 1) |
| Outputs don't sound Finnish | Use Gemma 3, not Mistral |
| Outputs too repetitive | Increase temperature or add more varied training data |
| OOM during training | Lower BATCH_SIZE or LORA_RANK |
| CUDA errors on Blackwell | Make sure Unsloth ≥ 2026.3.17 and PyTorch nightly cu128 |
