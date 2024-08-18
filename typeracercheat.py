import pyscreenshot as ImageGrab
import requests
from PIL import Image
import clipman as py
import io
import time
import pyautogui as pygui

py.init()

class ScreenshotOCR:
    def __init__(self, region=None, api_key=None,interval=0.08):
        self.region = region
        self.api_key = api_key or "K88541616888957"  # Use the provided API key
        self.api_url = "https://api.ocr.space/parse/image"  # OCR.space API URL
        self.interval = interval

    def capture_screenshot(self):
        # Take a screenshot of the entire screen or the specified region
        if self.region:
            # Capture a specific region
            screenshot = ImageGrab.grab(bbox=self.region)
            screenshot.show()
        else:
            # Capture the entire screen
            screenshot = ImageGrab.grab()
        return screenshot

    def convert_image_to_text_via_api(self, image):
        # Convert the image to bytes
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='PNG')
        image_bytes.seek(0)

        # Make the API request to OCR.space
        response = requests.post(
            self.api_url,
            files={"screenshot.png": image_bytes},
            data={"apikey": self.api_key, 
                  "language": "eng",
                  "isOverlayRequired":"True",
                  "OCREngine": 2,
                  "scale":"True"}  # English OCR
        )

        # Parse the response
        if response.status_code == 200:
            result = response.json()
            if result['IsErroredOnProcessing'] is False:
                text = result['ParsedResults'][0]['ParsedText']
                return text
            else:
                print(f"API error: {result['ErrorMessage']}")
                return ""
        else:
            print(f"API request failed with status code: {response.status_code}")
            return ""

    def save_text_to_clipboard(self, text):
        # Save the extracted text to the clipboard
        py.set(text)
    
    def filter_text(self, text):
        # Extract the relevant text between the specified markers
        start_marker = "Looking for competitors..."
        end_marker = "change display format"
        
        start_index = text.find(start_marker)
        end_index = text.find(end_marker)

        if start_index != -1 and end_index != -1:
            return text[start_index + len(start_marker):end_index].strip()
        return ""

    def process_screenshot(self):
        print("Please click on the desired screen area...")
        time.sleep(3.5)  # Give time to click the desired area

        # Capture the screenshot after the click
        screenshot = self.capture_screenshot()

        # Convert the screenshot image to text via API
        text = self.convert_image_to_text_via_api(screenshot)
        # text = self.clipboardoption()
        # self.typing(text)

        # Save the text to the clipboard
        self.save_text_to_clipboard(text)
        self.typing(text,sleep=False)

        # Output the text for debugging purposes
        print("Extracted text:", text)
    
    def type_screenshot(self):
        text = self.clipboardoption()
        self.typing(text)
        print("Extracted text:", text)
    
    def clipboardoption(self):
        input("Press Enter when you copied: ")
        first_word = input("Enter first word: ")
        time.sleep(1.5)
        text = py.get()
        complete_text = "     "+first_word+text
        return complete_text

    def typing(self, text,sleep=True):
        if sleep:
            time.sleep(5)
            pygui.typewrite(text, interval=self.interval)
        else:
            # time.sleep(1)
            pygui.typewrite(text, interval=0.008)

# Example usage
if __name__ == "__main__":
    # Define the region of the screen to capture (left, top, width, height)
    # region = (634, 473, 1202, 686)
    region = ((666, 363, 1225, 572))  # Adjust as needed
    interval = 0.08
    api_key = "YOUR API KEY" #Enter your api key

    # Replace 'your_api_key_here' with your actual OCR API key
    ocr_tool = ScreenshotOCR(region=region, api_key=api_key,interval=interval)
    print("Please tell me which type of cheat you want: ")
    print("1.Screen Ocr When Cheat test appears: ")
    print("2.Simple Tping")
    choice = int(input("Enter your Choice: "))
    if choice == 1:
        ocr_tool.process_screenshot()
    else:
        ocr_tool.type_screenshot()
