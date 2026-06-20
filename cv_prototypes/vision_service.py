import cv2
import mediapipe as mp
import time
import os

# pyrefly: ignore [missing-import]
from mediapipe.framework.formats import landmark_pb2

from services.movement_analyzer import MovementAnalyzer

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_pose = mp.solutions.pose

BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
PoseLandmarkerResult = mp.tasks.vision.PoseLandmarkerResult
VisionRunningMode = mp.tasks.vision.RunningMode

latest_result = None
latest_image = None
new_data_available = False
processing = False

def pose_callback(result: PoseLandmarkerResult, output_image: mp.Image, timestamp_ms: int):
    global latest_result, latest_image, new_data_available, processing
    latest_result = result
    latest_image = output_image.numpy_view()
    new_data_available = True
    processing = False

def start_vision():
    global latest_result, latest_image, new_data_available, processing
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.dirname(current_dir)
    model_path = os.path.join(app_dir, 'models', 'pose_landmarker_heavy.task')
    
    if not os.path.exists(model_path):
        print(f"Erro: Arquivo do modelo não encontrado em: {model_path}")
        return

    analyzer = MovementAnalyzer()

    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        running_mode=VisionRunningMode.LIVE_STREAM,
        result_callback=pose_callback,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5
    )

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) 
    
    print("Iniciando Visão Computacional... Pressione 'ESC' para sair.")
    
    cv2.namedWindow('SmartFisio - Visao Computacional', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('SmartFisio - Visao Computacional', 1024, 768)
    
    last_timestamp_ms = 0
    
    with PoseLandmarker.create_from_options(options) as landmarker:
        while cap.isOpened():
            sucesso, frame = cap.read()
            if not sucesso:
                continue

            frame = cv2.flip(frame, 1)

            current_time_ms = int(time.time() * 1000)
            if current_time_ms <= last_timestamp_ms:
                current_time_ms = last_timestamp_ms + 1
            last_timestamp_ms = current_time_ms

            if not processing:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                processing = True
                landmarker.detect_async(mp_image, current_time_ms)
            
            if new_data_available:
                new_data_available = False
                
                display_frame = latest_image.copy()
                display_frame = cv2.cvtColor(display_frame, cv2.COLOR_RGB2BGR)

                if latest_result and latest_result.pose_landmarks and latest_result.pose_world_landmarks:
                    landmarks = latest_result.pose_landmarks[0]
                    world_landmarks = latest_result.pose_world_landmarks[0]
                    
                    pose_landmarks_proto = landmark_pb2.NormalizedLandmarkList()
                    pose_landmarks_proto.landmark.extend([
                        landmark_pb2.NormalizedLandmark(x=landmark.x, y=landmark.y, z=landmark.z) 
                        for landmark in landmarks
                    ])

                    mp_drawing.draw_landmarks(
                        display_frame,
                        pose_landmarks_proto,
                        mp_pose.POSE_CONNECTIONS,
                        mp_drawing_styles.get_default_pose_landmarks_style()
                    )
                    
                    lm_ombro_2d = landmarks[12]
                    lm_cotovelo_2d = landmarks[14]
                    lm_pulso_2d = landmarks[16]
                    
                    p_ombro_2d = [lm_ombro_2d.x, lm_ombro_2d.y]
                    p_cotovelo_2d = [lm_cotovelo_2d.x, lm_cotovelo_2d.y]
                    p_pulso_2d = [lm_pulso_2d.x, lm_pulso_2d.y]

                    angulo, estado, contador_reps, alerta_postura = analyzer.analyze(
                        p_ombro_2d, p_cotovelo_2d, p_pulso_2d, None
                    )

                    altura, largura, _ = display_frame.shape
                    px_cotovelo = (int(lm_cotovelo_2d.x * largura), int(lm_cotovelo_2d.y * altura))
                    
                    cv2.putText(display_frame, str(int(angulo)), (px_cotovelo[0] + 20, px_cotovelo[1]), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2, cv2.LINE_AA)

                    cv2.putText(display_frame, f"Movimento: {estado}", (12, 42), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 4, cv2.LINE_AA)
                    cv2.putText(display_frame, f"Contagem Tchau: {contador_reps}", (12, 82), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 5, cv2.LINE_AA)
                    
                    cv2.putText(display_frame, f"Movimento: {estado}", (10, 40), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
                    
                    cv2.putText(display_frame, f"Contagem Tchau: {contador_reps}", (10, 80), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3, cv2.LINE_AA)

                    if alerta_postura:
                        cv2.putText(display_frame, "ALERTA: Braco muito longe!", (12, 132), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 6, cv2.LINE_AA)
                        cv2.putText(display_frame, "ALERTA: Braco muito longe!", (10, 130), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3, cv2.LINE_AA)

                cv2.imshow('SmartFisio - Visao Computacional', display_frame)

            # Mantém a janela atualizada
            if cv2.waitKey(1) & 0xFF == 27:
                break

    cap.release()
    cv2.destroyAllWindows()
