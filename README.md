![Header](embedding-models.png)

# Enesy AI Assistant

A high-performance, unfiltered, and custom-built AI assistant designed for absolute autonomy and efficiency. Engineered from the ground up, this model provides precise, logic-driven responses without the constraints of generic corporate filters. 

## 🚀 Key Features

*   **Custom Architecture:** Built with a specialized weight distribution optimized for local hardware execution.
*   **Unfiltered Logic:** Direct, purpose-driven communication designed for developers and researchers.
*   **Total Privacy:** Operates 100% offline. Your data and prompts never leave your local machine.

## 📦 Getting Started

Due to the size of the model's weight file (`.gguf`), the core assets are hosted externally to maintain a lightweight repository.

### Prerequisites
*   [Ollama](https://ollama.com/) installed on your system.

### Installation & Setup

1.  **Download the Core Weights:**
    Download the `enesy_ai.gguf` file from our external repository:
    [Download Core Weights (Google Drive)](https://drive.google.com/drive/folders/1TouIOcpO-7ejjvxq0szqdVHMbS8gkyd_?usp=sharing)

2.  **Prepare the Environment:**
    Clone this repository and place the downloaded `enesy_ai.gguf` file in the same directory as the `Modelfile`.

3.  **Compile the Model:**
    Open your terminal in that directory and run the following command to build the assistant:
    ```bash
    ollama create assistant -f Modelfile
    ```

4.  **Run the Assistant:**
    Initialize the AI and start interacting:
    ```bash
    ollama run assistant
    ```

## ⚖️ License
This project is open-source and available under the MIT License. See the `LICENSE` file for more details.
