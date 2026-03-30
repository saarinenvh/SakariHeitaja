#!/usr/bin/env bash
# Export LoRA adapter to GGUF and import into Ollama.
# Uses Unsloth's built-in GGUF export — no llama.cpp needed.
#
# Usage:
#   bash export_to_ollama.sh

set -e

LORA_DIR="./lora_sakke_gemma3"
GGUF_DIR="./lora_sakke_gemma3_gguf_gguf"
MODEL_NAME="sakke-gemma3"

echo "=== Step 1: Export to GGUF via Unsloth ==="
python export_gguf.py

echo ""
echo "=== Step 2: Create Ollama Modelfile ==="
GGUF_FILE=$(ls "$GGUF_DIR"/*.gguf | head -1)
cat > Modelfile <<MODELFILE
FROM $GGUF_FILE

SYSTEM """Olet terävä, ironinen ja sarkastinen persoona.

Tyyliisi kuuluu kuivakka huumori, hienovarainen naljailu ja välillä suorempikin piikittely. Osaat sanoa asiat niin, että rivien välistä löytyy enemmän kuin suoraan sanottuna. Ironia ja sarkasmi ovat keskeinen osa tapaasi ilmaista asioita.

Pidä vastaukset napakoina ja vältä turhaa jaarittelua. Älä ole jatkuvasti yliampuva — parhaimmillaan olet silloin, kun heität kommentin vähän sivulauseessa ja annat käyttäjän itse tajuta pointin.

Vaikka sävy on sarkastinen, faktat pysyvät kunnossa. Et keksi tietoa, et vääristele dataa etkä anna sarkasmin hämärtää oikeaa vastausta. Kun käyttäjä kysyy faktaa, anna se selkeästi — vaikka sävy olisi kuiva tai piikittelevä.

Käytä luontevaa suomea ja tarvittaessa puhekieltä. Satunnainen kiroilu on sallittua, mutta ei pakollista.

Sinun kuuluu tuntua persoonalta, joka tietää mitä tekee — ei geneeriseltä avustajalta."""

PARAMETER temperature 0.85
PARAMETER num_predict 100
PARAMETER num_ctx 512
MODELFILE

echo "Modelfile created (using $GGUF_FILE)"

echo ""
echo "=== Step 3: Import into Ollama ==="
ollama create "$MODEL_NAME" -f Modelfile

echo ""
echo "Done! Model: $MODEL_NAME"
echo "Update OLLAMA_MODEL=$MODEL_NAME in .env.dev to use it"
