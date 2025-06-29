import zlib
from pydub import AudioSegment

def get_gif_loop_count(gif_binary):
    """
    Extract the loop count from the Netscape Application Extension block in a GIF binary.
    Returns the loop count as an integer, or None if not found.
    """
    # Netscape Application Extension block signature
    netscape_pattern = b'\x21\xFF\x0B' + b'NETSCAPE2.0' + b'\x03\x01'
    netscape_pattern_len = len(netscape_pattern)

    # Find the Netscape Application Extension block
    pos = gif_binary.find(netscape_pattern)
    if pos == -1:
        return None

    # The loop count is 2 bytes after the pattern
    pos += netscape_pattern_len

    # Check if there are at least 2 bytes left
    if len(gif_binary) < pos + 2:
        return None

    # Extract the loop count (2 bytes, little-endian)
    loop_count = gif_binary[pos] + (gif_binary[pos+1] << 8)

    # Note: loop_count == 0 means "loop forever"
    return loop_count


def append_audio_to_gif(gif_path, audio_path, output_path):
  with open(gif_path, 'rb') as gif_file:
      gif_data = gif_file.read()

  with open(audio_path, 'rb') as audio_file:
      audio_data = audio_file.read()

  loop_count = get_gif_loop_count(gif_data)
  if loop_count is None:
      raise ValueError("Loop count not found in the GIF file.")
  loop_count_bytes = loop_count.to_bytes(2, byteorder='little')

  # Add a delimiter to separate gif and audio
  delimiter = b'AUD'

  with open(output_path, 'wb') as output_file:
      output_file.write(gif_data)
      output_file.write(delimiter)
      output_file.write(loop_count_bytes)
      output_file.write(audio_data)

  print(f"Combined file written to: {output_path}")


append_audio_to_gif('/examples/keanu_loop3x.gif', '/examples/keanu.mp3', '/examples/output2.gifa')