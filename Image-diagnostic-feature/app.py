import os
import numpy as np
import cv2
import tensorflow as tf
import warnings
from flask import Flask, request, render_template, redirect
from PIL import Image

warnings.filterwarnings("ignore")

app = Flask(__name__)

# --- Load Model 1: Brain Tumor MRI ---
MODEL_PATH_MRI = "best_mri_classifier.h5"
DATA_DIR_MRI = "brain_tumor_classification-mri/Training/"
model_mri = tf.keras.models.load_model(MODEL_PATH_MRI)
CLASS_NAMES_MRI = sorted(os.listdir(DATA_DIR_MRI))
print(f"✅ Brain Tumor MRI model loaded. Classes: {CLASS_NAMES_MRI}")

# --- Load Model 2: Skin Disease ---
MODEL_PATH_SKIN = "best_skin_classifier.h5"
DATA_DIR_SKIN = "skin-disease-dataset/train_set/"
model_skin = tf.keras.models.load_model(MODEL_PATH_SKIN)
CLASS_NAMES_SKIN = sorted(os.listdir(DATA_DIR_SKIN))
print(f"✅ Skin Disease model loaded. Classes: {CLASS_NAMES_SKIN}")

# --- Load Model 3: Lung Disease X-Ray ---
MODEL_PATH_XRAY = "best_xray_classifier.h5"
# --- THIS PATH IS NOW CORRECTED ---
DATA_DIR_XRAY = "Lung Disease Dataset/" 
model_xray = tf.keras.models.load_model(MODEL_PATH_XRAY)
CLASS_NAMES_XRAY = sorted(os.listdir(DATA_DIR_XRAY))
print(f"✅ Lung X-Ray model loaded. Classes: {CLASS_NAMES_XRAY}")


# --- Universal Preprocessing Function ---
def preprocess_image(image_stream):
    filestr = image_stream.read()
    npimg = np.frombuffer(filestr, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Image could not be read.")
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224))
    img_array = tf.keras.applications.efficientnet_v2.preprocess_input(img.astype(np.float32))
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


# --- Main Web Page Route ---
@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            return redirect(request.url)
        
        model_type = request.form.get('model_type')

        if file:
            try:
                img = preprocess_image(file)
                
                if model_type == 'mri':
                    preds = model_mri.predict(img)
                    class_names = CLASS_NAMES_MRI
                    model_name = "Brain Tumor MRI"
                
                elif model_type == 'skin':
                    preds = model_skin.predict(img)
                    class_names = CLASS_NAMES_SKIN
                    model_name = "Skin Disease"

                elif model_type == 'xray':
                    preds = model_xray.predict(img)
                    class_names = CLASS_NAMES_XRAY
                    model_name = "Lung Disease X-Ray"
                
                else:
                    return render_template('index.html', error="Please select a model type.")

                class_id = np.argmax(preds[0])
                confidence = preds[0][class_id] * 100
                predicted_class = class_names[class_id]

                result_str = f"Prediction: {predicted_class}"
                conf_str = f"Confidence: {confidence:.2f}%"
                model_str = f"Model Used: {model_name}"

                return render_template('index.html', result=result_str, confidence=conf_str, model_used=model_str)

            except Exception as e:
                print(e)
                return render_template('index.html', error=f"An error occurred. Ensure you uploaded an image.")

    return render_template('index.html', result=None, confidence=None, model_used=None, error=None)

# --- Run the App ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')