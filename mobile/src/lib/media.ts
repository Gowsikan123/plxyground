import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { uploads } from '@/api/endpoints';

const MAX_WIDTH = 1080;

/**
 * Lets the user pick a photo, shrinks it to at most 1080px wide as a JPEG,
 * uploads it and returns the public URL. Returns null if they cancel.
 * Shrinking first keeps uploads to a few hundred KB, well inside the API's limit.
 */
export async function pickAndUploadPhoto(options: { square?: boolean } = {}): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Allow photo access in Settings to add a picture.');
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: options.square ? [1, 1] : undefined,
    quality: 1,
  });
  const asset = picked.canceled ? undefined : picked.assets[0];
  if (!asset) return null;

  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!result.base64) throw new Error('Could not read the photo. Try another one.');

  const { url } = await uploads.image(result.base64, 'image/jpeg');
  return url;
}
