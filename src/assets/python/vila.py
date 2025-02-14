from transformers import VisionEncoderDecoderModel, ViTFeatureExtractor, AutoTokenizer
from PIL import Image

# Load the model, tokenizer, and feature extractor
model_name = "Efficient-Large-Model/VILA1.5-3b"
model = VisionEncoderDecoderModel.from_pretrained(model_name)
feature_extractor = ViTFeatureExtractor.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Load and preprocess the image
image_path = "/tmp/imageia/processor-pyclient/temp/sample1.png"  # Replace with your image path
image = Image.open(image_path).convert("RGB")
inputs = feature_extractor(images=image, return_tensors="pt")

# Prepare input for text (if needed for the task)
input_text = "Describe this image."
input_ids = tokenizer(input_text, return_tensors="pt").input_ids

# Generate outputs
outputs = model.generate(
    input_ids=inputs.pixel_values,
    decoder_input_ids=input_ids,
    max_length=50,
    num_beams=5,
    early_stopping=True
)

# Decode and print the result
result_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print("Generated Text:", result_text)
