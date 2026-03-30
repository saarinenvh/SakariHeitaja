# Sakke LoRA Training Cheatsheet

## Local PC (WSL, RTX 5080)

### Setup venv (first time only)
```bash
cd /home/villehs/projects/SakariHeitaja/training
python3 -m venv sakke-venv
source sakke-venv/bin/activate
pip install "unsloth[cu124] @ git+https://github.com/unslothai/unsloth.git"
pip install -r requirements.txt
```

### Activate venv
```bash
source /home/villehs/projects/SakariHeitaja/training/sakke-venv/bin/activate
```

### Generate training data
```bash
# Generate ChatGPT prompt file → paste into ChatGPT → save output as data/chatgpt.json
python3 generate_chatgpt.py

# Generate data using OpenEuroLLM via Ollama
OLLAMA_BASE_URL=http://192.168.1.101:11434 python3 generate_eurollm.py

# Merge all data//*.json and data//*.jsonl into training_data.jsonl
python3 merge_datasets.py
```

### Train LoRA
```bash
PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True python3 train_lora.py
# Output: lora_sakke/
```

### Export to GGUF and deploy
```bash
# Needs llama.cpp cloned somewhere
LLAMA_CPP_DIR=~/llama.cpp bash export_to_ollama.sh
# Output: sakke-gemma3.gguf + Modelfile

# Copy to server
scp sakke-gemma3.gguf sakke@192.168.1.101:~/
scp Modelfile sakke@192.168.1.101:~/
```

---

## Server (192.168.1.101)

### SSH in
```bash
ssh sakke@192.168.1.101
```

### Setup venv (first time only)
```bash
python3 -m venv ~/sakke-venv
source ~/sakke-venv/bin/activate
pip install "unsloth[cu124] @ git+https://github.com/unslothai/unsloth.git"
pip install -r requirements.txt
```

### Activate venv
```bash
source ~/sakke-venv/bin/activate
```

### Import model into Ollama
```bash
ollama create sakke-gemma3 -f Modelfile
```

### Check Ollama models
```bash
ollama list
```

### Follow Ollama logs
```bash
journalctl -u ollama -f
```

### Check GPU usage
```bash
nvidia-smi
watch -n 1 nvidia-smi   # live update every 1 sec
```

### Check RAM
```bash
free -h
```

### Check disk
```bash
df -h ~
```

---

## Bot (.env.dev)

### Switch model
```
OLLAMA_MODEL=sakke-gemma3   # fine-tuned
OLLAMA_MODEL=gemma3         # base fallback
```

### Run bot in dev
```bash
npm run dev
```
