![Enesy AI Assistant](embedding-models.png)

# Enesy AI Assistant

A custom-trained, highly logical, and filter-free conversational AI assistant based on the Llama 3.2 (3B) architecture. 

Unlike standard corporate models that rely on generic responses or restrictive filters, this assistant is fine-tuned to deliver pure logic, direct answers, and a highly efficient user experience. It runs entirely locally on your hardware using `ollama`, ensuring 100% privacy and offline capability.

## 🚀 Features
* **Zero Corporate Fluff:** Trained to assist without unnecessary apologies, generic filler words, or corporate filters.
* **Local & Private:** Runs completely offline on your own machine.
* **Highly Optimized:** Quantized to `Q4_K_M` format, making it incredibly fast and efficient, perfectly suited for Apple Silicon (M-series) and consumer-grade GPUs.

## 📦 Installation & Usage

Because the physical model weights (GGUF) exceed GitHub's file size limits, the core brain of the assistant is securely hosted externally.

### Prerequisites
You need to have [Ollama](https://ollama.com/) installed on your system.

### Quick Start
1. **Download the Core Model:**
   Download the `enesy_ai.gguf` (or `assistant.gguf`) file from our secure Google Drive repository:
   👉 **[Download Model Weights Here](https://drive.google.com/drive/folders/1TouIOcpO-7ejjvxq0szqdVHMbS8gkyd_?usp=sharing)**

2. **Download the Recipe:**
   Clone this repository or manually download the `Modelfile` to the **same directory** where you placed the `.gguf` file.

3. **Build the Assistant:**
   Open your terminal in that directory and run:
   ```bash
   ollama create assistant -f Modelfile
