
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;

namespace nfc_app
{
	/// <summary>
	/// Description of MainForm.
	/// </summary>
	public partial class MainForm : Form
	{
		public MainForm()
		{
			//
			// The InitializeComponent() call is required for Windows Forms designer support.
			//
			InitializeComponent();
			
			string data = "1234"
			SendKeys.Send(data);
		}
	}
}
