
export const convertImageToBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

export const createImageProxyUrl = (imageUrl) => {
  return imageUrl;
};

export const loadImageWithFallback = async (imageUrl, onSuccess, onError) => {
  try {
    const base64Url = await convertImageToBase64(imageUrl);
    if (base64Url) {
      onSuccess(base64Url);
      return;
    }
    
    onSuccess(imageUrl);
  } catch (error) {
    console.error('Failed to load image:', error);
    onError(error);
  }
}; 