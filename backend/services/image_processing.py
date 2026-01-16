import cv2
import numpy as np

def preprocess_image(image_path):
    """
    Optional: Pre-process image to enhance contrast or detect specific features
    before sending to AI. 
    For GPT-4o, raw images are usually fine, but resizing might save tokens/bandwidth.
    """
    img = cv2.imread(image_path)
    # Example: Resize if too large
    # ... logic here ...
    return image_path
