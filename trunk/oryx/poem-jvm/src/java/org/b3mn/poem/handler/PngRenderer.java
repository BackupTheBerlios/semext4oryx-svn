/***************************************
 * Copyright (c) 2008
 * Bjoern Wagner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
****************************************/

package org.b3mn.poem.handler;

import java.io.BufferedOutputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.servlet.http.HttpServletResponse;

import org.apache.batik.transcoder.TranscoderException;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.TranscoderOutput;
import org.apache.batik.transcoder.image.PNGTranscoder;
import org.b3mn.poem.Representation;
import org.b3mn.poem.util.ExportHandler;

@ExportHandler(uri="/png", formatName="PNG", iconUrl="/backend/images/silk/picture.png")
public class PngRenderer extends ImageRenderer {
	
	@Override
    protected void setResponseHeaders(HttpServletResponse res) {
  		res.setContentType("image/png");
  		res.setStatus(200);
    }

    @Override
    protected void transcode(String in_s, OutputStream out, Representation representation) throws TranscoderException, IOException {
    	
    	byte[] pngData = representation.getPngLarge();
    	if (pngData != null) {
			out.write(pngData);
		} else {    	
	    	InputStream in = new ByteArrayInputStream(in_s.getBytes("UTF-8"));
		  	PNGTranscoder transcoder = new PNGTranscoder();
		  	try {
		    	TranscoderInput input = new TranscoderInput(in);

		    	// Setup output
		    	ByteArrayOutputStream outBytes = new ByteArrayOutputStream();
		    	try {
			    	TranscoderOutput output = new TranscoderOutput(outBytes);
			    	// Do the transformation
					transcoder.transcode(input, output);
					representation.setPngLarge(outBytes.toByteArray());
					out.write(outBytes.toByteArray());
		    	} finally {
					out.close();
		    	}
		  	} finally {
		    	in.close();
			}
		}
    }
}
