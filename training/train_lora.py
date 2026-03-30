"""
LoRA fine-tuning for Gemma 3 4B using Unsloth (supports RTX 5080 / sm_120 / Blackwell via 2026.3.17+).

Hardware: RTX 5080 (16GB VRAM)
Requires PyTorch nightly with CUDA 12.8:
  pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu128
  pip install -r requirements.txt

Usage:
  PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True python train_lora.py
"""

import json
import warnings

from datasets import Dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer, SFTConfig

warnings.filterwarnings("ignore", category=FutureWarning, module="bitsandbytes")

# ── Config ────────────────────────────────────────────────────────────────────

BASE_MODEL    = "google/gemma-3-12b-it"
LORA_RANK     = 8
LORA_ALPHA    = 16
OUTPUT_DIR    = "./lora_sakke_gemma3_12b"
DATA_FILE     = "./training_data.jsonl"
MAX_SEQ_LEN   = 512
EPOCHS        = 1
BATCH_SIZE    = 2
GRAD_ACCUM    = 2
LEARNING_RATE = 5e-6

SYSTEM_PROMPT = (
    "Olet Sakke, fribaseuran maskotti ja amatööriselostaja.\n\n"
    "Vastaat suomeksi puhekielellä. Tyyli on rento, sarkastinen ja piikikäs. "
    "Kevyt kiroilu on sallittua. Vastaukset ovat yleensä 1–3 lausetta, "
    "usein 2–3 jos tilanteessa on enemmän kommentoitavaa."
)

# ── Load model + LoRA via Unsloth ─────────────────────────────────────────────

print("Loading model via Unsloth...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=BASE_MODEL,
    max_seq_length=MAX_SEQ_LEN,
    dtype=None,         # auto-detect (bf16 on Ampere+)
    load_in_4bit=True,  # 4-bit quantization to fit in 16GB
    attn_implementation="eager",  # avoid flex_attention Triton OOM on Blackwell
)

model = FastLanguageModel.get_peft_model(
    model,
    r=LORA_RANK,
    lora_alpha=LORA_ALPHA,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)
model.print_trainable_parameters()

# ── Format dataset ─────────────────────────────────────────────────────────────

def format_example(entry: dict) -> str:
    return tokenizer.apply_chat_template(
        [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": entry["input"]},
            {"role": "assistant", "content": entry["output"]},
        ],
        tokenize=False,
        add_generation_prompt=False,
    )

raw_data = []
with open(DATA_FILE, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            raw_data.append(json.loads(line))

print(f"Loaded {len(raw_data)} training examples")
dataset = Dataset.from_list([{"text": format_example(e)} for e in raw_data])
dataset = dataset.shuffle(seed=42)

# ── Train ─────────────────────────────────────────────────────────────────────

trainer = SFTTrainer(
    model=model,
    processing_class=tokenizer,
    train_dataset=dataset,

    args=SFTConfig(
        dataset_text_field="text",
        max_length=MAX_SEQ_LEN,
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUM,
        warmup_steps=25,
        num_train_epochs=EPOCHS,
        learning_rate=LEARNING_RATE,
        bf16=True,
        fp16=False,
        logging_steps=5,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        max_grad_norm=1.0,
        seed=42,
        output_dir=OUTPUT_DIR,
        save_strategy="epoch",
        report_to="none",
    ),
)

print("Starting training...")
trainer.train()

# ── Save ─────────────────────────────────────────────────────────────────────

model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print(f"\nLoRA adapter saved → {OUTPUT_DIR}/")
print("Next step: run python export_gguf.py to convert to GGUF")
