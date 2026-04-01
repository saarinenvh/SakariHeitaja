"""
Export trained LoRA adapter to GGUF via Unsloth.
Run directly (not via heredoc) so Unsloth can install llama.cpp interactively.

Usage:
  python export_gguf.py
"""
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    "./lora_sakke_poro2_8b", max_seq_length=512, dtype=None, load_in_4bit=True
)
model.save_pretrained_gguf("./lora_sakke_poro2_8b_gguf", tokenizer, quantization_method="q5_k_m")
print("GGUF saved → ./lora_sakke_poro2_8b_gguf/")
