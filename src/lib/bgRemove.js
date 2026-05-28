import {removeBackground} from "@imgly/background-removal"

export const processImage = async (image, config) => {
  return await removeBackground(image, config)
}
