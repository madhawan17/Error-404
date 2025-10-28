import os
import numpy as np
import tensorflow as tf
import warnings
warnings.filterwarnings("ignore")

# ------------------ CONSTANTS ------------------
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32

# --- CHANGE 1: Set number of classes to 8 ---
NUM_CLASSES = 8

# --- CHANGE 2: Update data directories ---
TRAIN_DIR = 'skin-disease-dataset/train_set/' 
VAL_DIR = 'skin-disease-dataset/test_set/' 

LEARNING_RATE = 0.001
EPOCHS = 50

# ------------------ LOAD DATA ------------------
# (This section is now correct with the new paths)
train_ds = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR,
    seed=123,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    VAL_DIR,
    seed=123,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE
)

CLASS_NAMES = np.array(train_ds.class_names)
print(f"Found {len(CLASS_NAMES)} classes: {CLASS_NAMES}")

# ------------------ DATA AUGMENTATION ------------------
# (No changes needed)
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal_and_vertical"),
    tf.keras.layers.RandomRotation(0.2),
    tf.keras.layers.RandomZoom(0.2),
])

# ------------------ BUILD MODEL ------------------
# (No changes needed, we can reuse EfficientNetV2B0)
base_model = tf.keras.applications.EfficientNetV2B0(
    input_shape=IMAGE_SIZE + (3,),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False

inputs = tf.keras.Input(shape=IMAGE_SIZE + (3,))
x = data_augmentation(inputs)
x = tf.keras.applications.efficientnet_v2.preprocess_input(x)
x = base_model(x, training=False)
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dropout(0.3)(x)
outputs = tf.keras.layers.Dense(NUM_CLASSES, activation='softmax')(x)

model = tf.keras.Model(inputs, outputs)
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ------------------ TRAIN MODEL ------------------
callbacks = [
    # --- CHANGE 3: Save a new model file ---
    tf.keras.callbacks.ModelCheckpoint("best_skin_classifier.h5", save_best_only=True),
    tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True)
]

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    callbacks=callbacks
)

print("✅ Training finished. Model saved as 'best_skin_classifier.h5'")